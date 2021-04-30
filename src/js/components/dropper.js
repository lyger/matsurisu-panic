import Phaser from "phaser";
import { DEPTH, GROUNDHEIGHT, WIDTH } from "../globals";
import store from "../store";
import {
  addTextEffect,
  applyModifiersToState,
  syncSpritePhysics,
} from "../utils";
import { getAvailablePowerups } from "./items/catalog";

const PBAR_WIDTH = 658;
const PBAR_HEIGHT = 12;
const PBAR_Y = 345;

function euclidean(x, y) {
  return Math.sqrt(Math.pow(x, 2) + Math.pow(y, 2));
}

export default class Dropper extends Phaser.GameObjects.Group {
  constructor(scene) {
    super(scene);

    this.state = store.getState().stage;
    this.applyModifiersToConfigs();

    this.matsurisu = this.scene.physics.add.group();
    this.money = this.scene.physics.add.group();
    this.powerup = this.scene.physics.add.group();
    this.extraConfigs = [];

    this.totalY = 0;

    this.add(this.matsurisu);
    this.add(this.money);
    this.add(this.powerup);

    this.generateItems();

    this.createTimer();
    this.createProgressBar();
    this.createEvents();
  }

  generateItems() {
    const matsurisuCfg = this.modMatsurisu;
    const moneyCfg = this.modMoney;
    const powerupCfg = this.modPowerup;
    const ebifrionCfg = this.modEbifrion;

    const rand = Phaser.Math.RND;

    // GENERATE MATSURISU
    this.matsurisuBuffer = [];
    this.matsurisuLastSpawn = 0;

    let last = {
      deltaY: 0,
      x: rand.between(matsurisuCfg.minX, matsurisuCfg.maxX),
    };

    this.matsurisuBuffer.push(last);

    let totalY = 0;

    for (let i = 0; i < matsurisuCfg.number - 1; i++) {
      // Attempt 10 times to produce new coordinates that fulfill the conditions
      let deltaY, newX;
      for (let j = 0; j < 10; j++) {
        deltaY = rand.between(
          matsurisuCfg.minSpacingY,
          matsurisuCfg.maxSpacingY
        );
        newX = rand.between(matsurisuCfg.minX, matsurisuCfg.maxX);

        const absDeltaX = Math.abs(last.x - newX);

        if (
          absDeltaX >= matsurisuCfg.minSpacingX &&
          absDeltaX <= matsurisuCfg.maxSpacingX &&
          euclidean(absDeltaX, deltaY) >= matsurisuCfg.minDistance
        )
          break;
      }
      const next = {
        deltaY: deltaY,
        x: newX,
      };

      this.matsurisuBuffer.push(next);

      last = next;
      totalY += deltaY;
    }
    this.maximumY = totalY;

    // GENERATE MONEY
    this.moneyBuffer = [];

    const numMoney = rand.between(moneyCfg.minNumber, moneyCfg.maxNumber);

    for (let i = 0; i < numMoney; i++) {
      this.moneyBuffer.push({
        y: rand.between(0, totalY),
        x: rand.between(moneyCfg.minX, moneyCfg.maxX),
      });
    }

    this.moneyBuffer.sort((a, b) => a.y - b.y);

    // GENERATE POWERUPS
    this.powerupBuffer = [];

    const numPowerup = rand.between(powerupCfg.minNumber, powerupCfg.maxNumber);

    const availablePowerups = getAvailablePowerups();

    if (availablePowerups.length > 0) {
      for (let i = 0; i < numPowerup; i++) {
        this.powerupBuffer.push({
          y: rand.between(0, totalY),
          x: rand.between(powerupCfg.minX, powerupCfg.maxX),
          target: Phaser.Utils.Array.GetRandom(availablePowerups),
        });
      }

      this.powerupBuffer.sort((a, b) => a.y - b.y);
    }

    // GENERATE EBIFRION
    const ebifrionPoints = [];
    for (let i = 0; i < 4; i++) {
      ebifrionPoints.push(
        rand.between(ebifrionCfg.minX, ebifrionCfg.maxX),
        (i + 1) * 280 - 100
      );
    }
    const ebifrionStartX = rand.between(ebifrionCfg.minX, ebifrionCfg.maxX);
    const ebifrionPath = new Phaser.Curves.Path(ebifrionStartX, -100).splineTo(
      ebifrionPoints
    );
    this.ebifrion = new Phaser.GameObjects.PathFollower(
      this.scene,
      ebifrionPath,
      ebifrionStartX,
      -100,
      "items",
      0
    )
      .setDepth(DEPTH.OBJECTDEPTH)
      .setOrigin(0.5, 0.5);
    this.ebifrionStartY = rand.between(0, Math.floor(0.85 * totalY));
    this.ebifrionActive = false;
    this.scene.add.existing(this.ebifrion);
    this.scene.physics.add.existing(this.ebifrion);
    this.ebifrion.body.setCircle(40, 24, 24);
  }

  createTimer() {
    this.timer = this.scene.time.addEvent({
      delay: Infinity,
    });
    this.timer.paused = true;

    this.scene.events.on("dropper.start", () => {
      this.timer.paused = false;
      this.totalY = 0;
    });
  }

  createProgressBar() {
    this.progressBar = this.scene.add
      .rectangle(WIDTH / 2 - PBAR_WIDTH / 2, PBAR_Y, 0, PBAR_HEIGHT, 0x182538)
      .setDepth(DEPTH.BGFRONT);
  }

  createEvents() {
    const checkFinished = () => {
      if (this.matsurisuBuffer.length > 0) return;
      if (this.moneyBuffer.length > 0) return;
      if (this.matsurisu.countActive() > 0) return;
      if (this.money.countActive() > 0) return;
      this.scene.events.emit("dropper.done");
    };

    this.scene.events.on("matsurisu.catch", checkFinished);
    this.scene.events.on("matsurisu.drop", checkFinished);
    this.scene.events.on("money.catch", checkFinished);
    this.scene.events.on("money.drop", checkFinished);

    this.scene.events.on("matsurisu.catch", this.catchMatsurisu, this);
    this.scene.events.on("matsurisu.drop", this.dropMatsurisu, this);
    this.scene.events.on("money.catch", this.collectMoney, this);
    this.scene.events.on("money.drop", this.dropMoney, this);
    this.scene.events.on("powerup.catch", this.collectPowerup, this);
    this.scene.events.on("powerup.drop", this.dropPowerup, this);
    this.scene.events.on("ebifrion.catch", this.catchEbifrion, this);
    this.scene.events.on("ebifrion.drop", this.dropEbifrion, this);
  }

  showAirBonus(x, y, airborne, state) {
    if (!airborne) return;
    const airBonus = state.score.airCounter * state.score.bonusPerAir;
    if (airBonus === 0) return;
    addTextEffect(this.scene, { x, y, text: `AIR! +${airBonus}` });
  }

  catchMatsurisu({ x, y, isLow, state, airborne }) {
    if (isLow) {
      const multiplier = state.score.lowMultiplier;
      addTextEffect(this.scene, { x, y, text: `LOW! x${multiplier}` });
    }
    this.showAirBonus(x, y, airborne, state);
    const rand = Phaser.Math.RND;
    const deltaY = GROUNDHEIGHT - y - 75;
    if (deltaY > 0) {
      const flip = rand.sign();
      const deltaX = flip * rand.frac() * 0.3 * deltaY;
      const fallPath = this.scene.add
        .path(x, y)
        .splineTo([x + 0.6 * deltaX, y + 0.4 * deltaY, x + deltaX, y + deltaY]);
      const matsurisu = new Phaser.GameObjects.PathFollower(
        this.scene,
        fallPath,
        x,
        y,
        "matsurisu-normal-land",
        0
      )
        .setOrigin(0.5, 0.5)
        .setDepth(DEPTH.OBJECTDEPTH)
        .setFlipX(flip < 0);
      this.scene.add.existing(matsurisu);
      matsurisu.startFollow({
        duration: deltaY * 2 + 100,
        repeat: 0,
        ease: function (v) {
          return v ** 1.5;
        },
        onComplete: () => {
          matsurisu.setDepth(DEPTH.OBJECTBACK);
          matsurisu.anims.play("matsurisu-normal.stand");
          this.scene.tweens.add({
            targets: matsurisu,
            alpha: 0,
            repeat: 0,
            delay: 10000,
            duration: 500,
            onComplete: () => matsurisu.destroy(),
          });
        },
      });
    } else {
      const matsurisu = this.scene.add
        .sprite(x, GROUNDHEIGHT - 75, "matsurisu-normal-land", 1)
        .setOrigin(0.5, 0.5)
        .setDepth(DEPTH.OBJECTBACK)
        .setFlipX(rand.frac() > 0.5);
      matsurisu.anims.play("matsurisu-normal.stand");
      this.scene.tweens.add({
        targets: matsurisu,
        alpha: 0,
        repeat: 0,
        delay: 10000,
        duration: 500,
        onComplete: () => matsurisu.destroy(),
      });
    }
  }

  dropMatsurisu({ x, y }) {
    const matsurisu = this.scene.add
      .image(x, y, "matsurisu-normal-die")
      .setDepth(DEPTH.OBJECTDEPTH);
    this.scene.tweens.add({
      targets: matsurisu,
      alpha: 0,
      y: y - 200,
      repeat: 0,
      duration: 1000,
      onComplete: () => matsurisu.destroy(),
    });
  }

  collectMoney({ x, y, airborne, state }) {
    this.showAirBonus(x, y, airborne, state);
    const money = this.scene.add
      .image(x, y, "items", 2)
      .setDepth(DEPTH.OBJECTDEPTH);
    this.scene.tweens.add({
      targets: money,
      alpha: 0,
      y: y - 100,
      repeat: 0,
      duration: 300,
      onComplete: () => money.destroy(),
    });
  }

  dropMoney({ x, y }) {
    const money = this.scene.add
      .image(x, y, "items", 2)
      .setDepth(DEPTH.OBJECTDEPTH);
    this.scene.tweens.add({
      targets: money,
      alpha: 0,
      y: y + 75,
      repeat: 0,
      duration: 300,
      onComplete: () => money.destroy(),
    });
  }

  collectPowerup({ x, y, target, airborne, state }) {
    this.showAirBonus(x, y, airborne, state);
    const powerup = this.scene.add
      .image(x, y, target.texture, target.frame)
      .setDepth(DEPTH.OBJECTDEPTH);
    this.scene.tweens.add({
      targets: powerup,
      alpha: 0,
      y: y - 100,
      repeat: 0,
      duration: 300,
      onComplete: () => powerup.destroy(),
    });
  }

  dropPowerup({ x, y, target }) {
    const powerup = this.scene.add
      .image(x, y, target.texture, target.frame)
      .setDepth(DEPTH.OBJECTDEPTH);
    this.scene.tweens.add({
      targets: powerup,
      alpha: 0,
      y: y + 50,
      repeat: 0,
      duration: 300,
      onComplete: () => powerup.destroy(),
    });
  }

  catchEbifrion({ x, y, rotation, airborne, state }) {
    this.showAirBonus(x, y, airborne, state);
    const ebifrion = this.scene.add
      .image(x, y, "items", 0)
      .setDepth(DEPTH.OBJECTDEPTH);
    addTextEffect(this.scene, {
      x,
      y,
      text: `+${state.score.scorePerEbifrion}`,
    });
    this.scene.tweens.add({
      targets: ebifrion,
      rotation: rotation - 2 * Math.PI,
      alpha: 0,
      y: y - 75,
      repeat: 0,
      duration: 300,
      onComplete: () => ebifrion.destroy(),
    });
  }

  dropEbifrion({ x, y, rotation }) {
    const ebifrion = this.scene.add
      .image(x, y, "items", 0)
      .setDepth(DEPTH.OBJECTDEPTH);
    this.scene.tweens.add({
      targets: ebifrion,
      rotation: rotation + 2 * Math.PI,
      alpha: 0,
      y: y + 50,
      repeat: 0,
      duration: 300,
      onComplete: () => ebifrion.destroy(),
    });
  }

  applyModifiersToConfigs() {
    this.modMatsurisu = applyModifiersToState(this.state.matsurisu);
    this.modMoney = applyModifiersToState(this.state.money);
    this.modPowerup = applyModifiersToState(this.state.powerup);
    this.modEbifrion = applyModifiersToState(this.state.ebifrion);
    return this;
  }

  applyConfigsToSprites() {
    this.matsurisu.setVelocityY(this.modMatsurisu.fallSpeed);
    this.money.setVelocityY(this.modMoney.fallSpeed);
    this.powerup.setVelocityY(this.modPowerup.fallSpeed);
    return this;
  }

  reloadState() {
    const newState = store.getState().stage;
    if (this.state === newState) return;

    const doConfigUpdates =
      this.state.matsurisu !== newState.matsurisu ||
      this.state.money !== newState.money;
    this.state = newState;

    if (doConfigUpdates) this.applyModifiersToConfigs().applyConfigsToSprites();
    return this;
  }

  pause() {
    this.matsurisu.setVelocityY(0);
    this.money.setVelocityY(0);
    this.powerup.setVelocityY(0);
    this.ebifrion.pauseFollow();
    this.timer.paused = true;
    this.scene.anims.pauseAll();
    return this;
  }

  resume() {
    this.applyConfigsToSprites();
    this.ebifrion.resumeFollow();
    this.timer.paused = false;
    this.scene.anims.resumeAll();
    return this;
  }

  createExtra(matsurisu, config) {
    const { key, texture, frame, depth, x, y } = config;
    const newExtra = this.scene.physics.add
      .sprite(matsurisu.x + x, matsurisu.y + y, texture, frame)
      .setDepth(DEPTH.OBJECTDEPTH + depth)
      .setVisible(true)
      .setActive(true);
    matsurisu.setData(`extra:${key}`, newExtra);
    matsurisu.on("destroy", () => newExtra?.destroy?.());
  }

  addExtra({ key, duration, texture, frame, depth = 0, x = 0, y = 0 }) {
    const config = { key, texture, frame, depth, x, y };
    this.extraConfigs.push(config);
    this.matsurisu
      .getChildren()
      .forEach((matsurisu) => this.createExtra(matsurisu, config));
    this.scene.time.delayedCall(duration * 1000, () => {
      this.extraConfigs.splice(this.extraConfigs.indexOf(config), 1);
      this.matsurisu.getChildren().forEach((matsurisu) => {
        const extra = matsurisu.getData(`extra:${key}`);
        extra?.destroy?.();
      });
    });
  }

  update(time) {
    this.reloadState();
    const rand = Phaser.Math.RND;
    const delta = this.timer.elapsed;
    const matsurisuDeltaY =
      ((delta - this.matsurisuLastSpawn) / 1000) * this.modMatsurisu.fallSpeed;
    const matsurisuTotalY = this.totalY + matsurisuDeltaY;

    if (
      this.matsurisuBuffer.length > 0 &&
      this.matsurisuBuffer[0].deltaY < matsurisuDeltaY
    ) {
      const next = this.matsurisuBuffer.shift();
      this.matsurisuLastSpawn = delta;
      this.totalY += matsurisuDeltaY;

      const newMatsurisu = this.matsurisu
        .create(next.x, -100, "matsurisu-normal", 0, true, true)
        .setDepth(DEPTH.OBJECTDEPTH)
        .setVelocityY(this.modMatsurisu.fallSpeed)
        .setFlipX(rand.frac() > 0.5)
        .setRotation(rand.frac() * 2 * Math.PI);
      newMatsurisu.anims.play("matsurisu-normal.fall");
      newMatsurisu.body.setCircle(45, 30, 30);
      this.extraConfigs.forEach((config) =>
        this.createExtra(newMatsurisu, config)
      );
    }

    if (
      this.moneyBuffer.length > 0 &&
      this.moneyBuffer[0].y < matsurisuTotalY
    ) {
      const next = this.moneyBuffer.shift();

      const newMoney = this.money
        .create(next.x, -100, "items", 2, true, true)
        .setDepth(DEPTH.OBJECTDEPTH)
        .setVelocityY(this.modMoney.fallSpeed);
      newMoney.body.setCircle(40, 24, 24);
    }

    if (
      this.powerupBuffer.length > 0 &&
      this.powerupBuffer[0].y < matsurisuTotalY
    ) {
      const next = this.powerupBuffer.shift();

      const newPowerup = this.powerup
        .create(
          next.x,
          -100,
          next.target.texture,
          next.target.frame,
          true,
          true
        )
        .setDepth(DEPTH.OBJECTDEPTH)
        .setVelocityY(this.modPowerup.fallSpeed)
        .setData("target", next.target);
      newPowerup.body.setCircle(40, 24, 24);
    }

    if (!this.ebifrionActive && this.ebifrionStartY <= matsurisuTotalY) {
      this.ebifrionActive = true;
      this.ebifrion.startFollow(this.modEbifrion.fallDuration);
      this.scene.tweens.add({
        targets: this.ebifrion,
        rotation: 2 * Math.PI,
        duration: this.modEbifrion.fallDuration,
        repeat: 0,
      });
    }

    this.matsurisu.getChildren().forEach((matsurisu) => {
      this.extraConfigs.forEach(({ key, x, y }) => {
        const extra = matsurisu.getData(`extra:${key}`);
        if (extra !== undefined) syncSpritePhysics(matsurisu, extra, x, y);
      });
    });

    this.progressBar.setSize(
      Math.min(matsurisuTotalY / (this.maximumY + 200), 1) * PBAR_WIDTH,
      PBAR_HEIGHT
    );
  }
}
