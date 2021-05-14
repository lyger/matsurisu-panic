import Phaser from "phaser";
import { FEVER_TINT, DEPTH, GROUNDHEIGHT, WIDTH } from "../globals";
import store from "../store";
import { applyModifiersToState, syncSpritePhysics } from "../utils";
import { getAvailablePowerups } from "./items/catalog";

const PBAR_WIDTH = 676;
const PBAR_HEIGHT = 16;
const PBAR_Y = 332;
const TIMEOUT_BLINK_DURATION = 455;

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
    this.syncProps = {
      bonusAlpha: 1,
    };

    this.totalY = 0;

    this.add(this.matsurisu);
    this.add(this.money);
    this.add(this.powerup);

    this.generateDrops();

    this.createTimer();
    this.createProgressBar();
    this.createEvents();

    this.setupFever();
  }

  generateDrops() {
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

        const absDeltaX = Math.abs(newX - last.x);
        const inverseSlope =
          (absDeltaX + matsurisuCfg.slopeTurnaround) / deltaY;

        if (
          absDeltaX >= matsurisuCfg.minSpacingX &&
          absDeltaX <= matsurisuCfg.maxSpacingX &&
          inverseSlope <= matsurisuCfg.maxInverseSlope &&
          euclidean(absDeltaX, deltaY) >= matsurisuCfg.minDistance
        )
          break;
      }
      const next = {
        deltaY: deltaY,
        x: newX,
        bonus: false,
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
      .image(WIDTH / 2, PBAR_Y, "stage-progress")
      .setDepth(DEPTH.BGFRONT)
      .setCrop(0, 0, 0, PBAR_HEIGHT);
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
    this.scene.events.on("coin.catch", checkFinished);
    this.scene.events.on("coin.drop", checkFinished);

    this.scene.events.on("matsurisu.catch", this.catchMatsurisu, this);
    this.scene.events.on("matsurisu.drop", this.dropMatsurisu, this);
    this.scene.events.on("coin.catch", this.collectMoney, this);
    this.scene.events.on("coin.drop", this.dropMoney, this);
    this.scene.events.on("powerup.catch", this.collectPowerup, this);
    this.scene.events.on("powerup.drop", this.dropPowerup, this);
    this.scene.events.on("ebifrion.catch", this.catchEbifrion, this);
    this.scene.events.on("ebifrion.drop", this.dropEbifrion, this);
  }

  setupFever() {
    if (this.state.fever.number === 0) {
      this.feverStep = 0;
      this.numFever = 0;
      this.nextFeverY = Infinity;
    } else {
      this.feverStep = (0.8 * this.maximumY) / this.state.fever.number;
      this.numFever = 0;
      this.nextFeverY = this.feverStep;
      // Once fever has been activated for the level, we'll stop spawning more fever items
      this.scene.events.on("global.feverStart", () => {
        this.nextFeverY = Infinity;
        this.generateBonusMatsurisu();
      });
      this.scene.events.on(
        "global.feverTimeout",
        this.timeoutBonusMatsurisu,
        this
      );
      this.scene.events.on("global.feverEnd", this.clearBonusMatsurisu, this);
    }
  }

  catchMatsurisu({ x, y }) {
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
        ease: function (v) {
          return v ** 1.5;
        },
        onComplete: () => {
          matsurisu.setDepth(DEPTH.OBJECTBACK);
          matsurisu.anims.play("matsurisu-normal.stand");
          this.scene.tweens.add({
            targets: matsurisu,
            alpha: 0,
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
        delay: 10000,
        duration: 500,
        onComplete: () => matsurisu.destroy(),
      });
    }
  }

  dropMatsurisu({ x, y, rotation, bonus }) {
    const state = store.getState();
    if (state.score.invincible || bonus) {
      const matsurisu = this.scene.add
        .image(x, y, "matsurisu-normal", 0)
        .setRotation(rotation)
        .setDepth(DEPTH.OBJECTDEPTH);
      if (bonus) matsurisu.setTint(FEVER_TINT);
      this.scene.tweens.add({
        targets: matsurisu,
        alpha: 0,
        y: y + 100,
        duration: 500,
        onComplete: () => matsurisu.destroy(),
      });
    } else {
      const matsurisu = this.scene.add
        .image(x, y, "matsurisu-normal-die")
        .setDepth(DEPTH.OBJECTDEPTH);
      this.scene.tweens.add({
        targets: matsurisu,
        alpha: 0,
        y: y - 200,
        duration: 1000,
        onComplete: () => matsurisu.destroy(),
      });
    }
  }

  collectMoney({ x, y }) {
    const money = this.scene.add
      .image(x, y, "items", 2)
      .setDepth(DEPTH.OBJECTDEPTH);
    this.scene.tweens.add({
      targets: money,
      alpha: 0,
      y: y - 100,
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
      duration: 300,
      onComplete: () => money.destroy(),
    });
  }

  collectPowerup({ x, y, target, upgraded }) {
    if (upgraded !== null) {
      const upgradeEffect = this.scene.add
        .image(x, y, upgraded.texture, upgraded.frame)
        .setDepth(DEPTH.OBJECTDEPTH);
      this.scene.tweens.add({
        targets: upgradeEffect,
        scale: 1.5,
        alpha: 0,
        duration: 300,
        onComplete: () => upgradeEffect.destroy(),
      });
    } else {
      const powerup = this.scene.add
        .image(x, y, target.texture, target.frame)
        .setDepth(DEPTH.OBJECTDEPTH);
      this.scene.tweens.add({
        targets: powerup,
        alpha: 0,
        y: y - 100,
        duration: 300,
        onComplete: () => powerup.destroy(),
      });
    }
  }

  dropPowerup({ x, y, target }) {
    const powerup = this.scene.add
      .image(x, y, target.texture, target.frame)
      .setDepth(DEPTH.OBJECTDEPTH);
    this.scene.tweens.add({
      targets: powerup,
      alpha: 0,
      y: y + 50,
      duration: 300,
      onComplete: () => powerup.destroy(),
    });
  }

  catchEbifrion({ x, y, rotation }) {
    const ebifrion = this.scene.add
      .image(x, y, "items", 0)
      .setDepth(DEPTH.OBJECTDEPTH);
    this.scene.tweens.add({
      targets: ebifrion,
      rotation: rotation - 2 * Math.PI,
      alpha: 0,
      y: y - 75,
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

  createMatsurisu({ x, bonus }) {
    const rand = Phaser.Math.RND;
    const newMatsurisu = this.matsurisu
      .create(x, -100, "matsurisu-normal", 0, true, true)
      .setDepth(DEPTH.OBJECTDEPTH)
      .setVelocityY(this.modMatsurisu.fallSpeed)
      .setFlipX(rand.frac() > 0.5)
      .setRotation(rand.frac() * 2 * Math.PI)
      .setData({ fever: false, bonus });
    newMatsurisu.anims.play("matsurisu-normal.fall");
    newMatsurisu.body.setCircle(45, 30, 30);
    if (bonus) {
      newMatsurisu.setTint(FEVER_TINT);
      const syncAlpha = () => newMatsurisu.setAlpha(this.syncProps.bonusAlpha);
      this.scene.events.on("update", syncAlpha);
      const removeSyncAlpha = () => this.scene.events.off("update", syncAlpha);
      newMatsurisu.once("destroy", removeSyncAlpha);
    }
    this.extraConfigs.forEach((config) =>
      this.createExtra(newMatsurisu, config)
    );
    return newMatsurisu;
  }

  createMoney({ x }) {
    const newMoney = this.money
      .create(x, -100, "items", 2, true, true)
      .setDepth(DEPTH.OBJECTDEPTH)
      .setVelocityY(this.modMoney.fallSpeed)
      .setData("fever", false);
    newMoney.body.setCircle(40, 24, 24);
    return newMoney;
  }

  createPowerup({ x, target }) {
    const newPowerup = this.powerup
      .create(x, -100, target.texture, target.frame, true, true)
      .setDepth(DEPTH.OBJECTDEPTH)
      .setVelocityY(this.modPowerup.fallSpeed)
      .setData({ target, fever: false, refunded: false });
    newPowerup.body.setCircle(40, 24, 24);
    return newPowerup;
  }

  createExtra(
    target,
    { key, texture, frame, animation, depth = 0, x = 0, y = 0 }
  ) {
    const newExtra = this.scene.physics.add
      .sprite(target.x + x, target.y + y, texture, frame)
      .setDepth(DEPTH.OBJECTDEPTH + depth)
      .setVisible(true)
      .setActive(true);
    if (animation !== undefined) newExtra.anims.play(animation, true);
    target.setData(`extra:${key}`, newExtra);
    const syncExtra = () => {
      syncSpritePhysics(target, newExtra, x, y);
      newExtra.setAlpha(target.alpha);
    };
    this.scene.events.on("update", syncExtra);
    const destroyExtra = () => {
      this.scene.events.off("update", syncExtra);
      newExtra?.destroy?.();
    };
    target.once("destroy", destroyExtra);
    this.scene.events.once("transitionout", () =>
      target.off("destroy", destroyExtra)
    );
  }

  addExtra({
    key,
    duration,
    texture,
    frame,
    animation,
    depth = 0,
    x = 0,
    y = 0,
  }) {
    const config = { key, texture, frame, animation, depth, x, y };
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

  makeFeverItem(target) {
    target.setData("fever", true);
    target.setTint(FEVER_TINT);
    this.createExtra(target, {
      key: "feverItem",
      texture: "extra-fever",
      frame: 0,
      animation: "extra-fever.burn",
      depth: -1,
    });
    this.nextFeverY = this.nextFeverY + this.feverStep;
    this.numFever = this.numFever + 1;
  }

  generateBonusMatsurisu() {
    if (this.modMatsurisu.bonusPerSpawn === 0) return false;
    const rand = Phaser.Math.RND;
    const num = rand.between(1, this.modMatsurisu.bonusPerSpawn);
    if (this.matsurisuBuffer.length > 0) {
      const next = this.matsurisuBuffer[0];
      for (let i = 0; i < num; i++) {
        const deltaY = rand.between(0, 0.67 * next.deltaY);
        const x = rand.between(this.modMatsurisu.minX, this.modMatsurisu.maxX);
        this.matsurisuBuffer.unshift({ deltaY, x, bonus: true });
        next.deltaY -= deltaY;
      }
    }
    return true;
  }

  timeoutBonusMatsurisu(duration) {
    this.scene.tweens.add({
      targets: this.syncProps,
      bonusAlpha: 0,
      duration: TIMEOUT_BLINK_DURATION,
      repeat: Math.ceil((duration - TIMEOUT_BLINK_DURATION) / 1000) - 1,
      yoyo: true,
      onComplete: (blinkTween) => {
        this.scene.tweens.remove(blinkTween);
        this.scene.tweens.add({
          targets: this.syncProps,
          bonusAlpha: 0,
          duration: TIMEOUT_BLINK_DURATION,
          onComplete: (fadeTween) => this.scene.tweens.remove(fadeTween),
        });
      },
    });
  }

  clearBonusMatsurisu() {
    this.matsurisu
      .getChildren()
      .slice()
      .forEach((matsurisu) => {
        if (matsurisu.getData("bonus")) matsurisu.destroy();
      });
    let reclaimedDeltaY = 0;
    this.matsurisuBuffer = this.matsurisuBuffer.filter((config) => {
      const { bonus } = config;
      if (bonus) reclaimedDeltaY += config.deltaY;
      else if (reclaimedDeltaY > 0) {
        config.deltaY += reclaimedDeltaY;
        reclaimedDeltaY = 0;
      }
      return !bonus;
    });
  }

  update(time) {
    this.reloadState();
    const delta = this.timer.elapsed;
    const matsurisuDeltaY =
      ((delta - this.matsurisuLastSpawn) / 1000) * this.modMatsurisu.fallSpeed;
    const matsurisuTotalY = this.totalY + matsurisuDeltaY;

    const isNextFeverItem =
      this.numFever < this.state.fever.number &&
      matsurisuTotalY > this.nextFeverY;

    if (
      this.matsurisuBuffer.length > 0 &&
      this.matsurisuBuffer[0].deltaY < matsurisuDeltaY
    ) {
      const next = this.matsurisuBuffer.shift();
      this.matsurisuLastSpawn = delta;
      this.totalY += matsurisuDeltaY;

      const newMatsurisu = this.createMatsurisu(next);
      if (isNextFeverItem) this.makeFeverItem(newMatsurisu);

      if (!next.bonus) this.generateBonusMatsurisu();
    }

    if (
      this.moneyBuffer.length > 0 &&
      this.moneyBuffer[0].y < matsurisuTotalY
    ) {
      const next = this.moneyBuffer.shift();

      const newMoney = this.createMoney(next);
      if (isNextFeverItem) this.makeFeverItem(newMoney);
    }

    if (
      this.powerupBuffer.length > 0 &&
      this.powerupBuffer[0].y < matsurisuTotalY
    ) {
      const next = this.powerupBuffer.shift();

      const newPowerup = this.createPowerup(next);
      if (isNextFeverItem) this.makeFeverItem(newPowerup);
    }

    if (!this.ebifrionActive && this.ebifrionStartY <= matsurisuTotalY) {
      this.ebifrionActive = true;
      this.ebifrion.startFollow(this.modEbifrion.fallDuration);
      this.scene.tweens.add({
        targets: this.ebifrion,
        rotation: 2 * Math.PI,
        duration: this.modEbifrion.fallDuration,
      });
    }

    this.progressBar.setCrop(
      0,
      0,
      Math.min(matsurisuTotalY / (this.maximumY + 200), 1) * PBAR_WIDTH,
      PBAR_HEIGHT
    );
  }
}
