import Phaser from "phaser";
import { DEPTH } from "../globals";
import store from "../store";
import { applyModifiersToState } from "../utils";
import { getAvailablePowerups } from "./items/catalog";

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

    this.totalY = 0;

    this.add(this.matsurisu);
    this.add(this.money);
    this.add(this.powerup);

    this.generateItems();

    this.createTimer();

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

    this.scene.events.on("money.catch", this.collectMoney, this);
    this.scene.events.on("money.drop", this.dropMoney, this);
    this.scene.events.on("matsurisu.drop", this.matsurisuDie, this);
    this.scene.events.on("powerup.catch", this.collectPowerup, this);
    this.scene.events.on("powerup.drop", this.dropPowerup, this);
    this.scene.events.on("ebifrion.catch", this.collectEbifrion, this);
    this.scene.events.on("ebifrion.drop", this.dropEbifrion, this);
  }

  createTimer() {
    this.timer = this.scene.time.addEvent({
      delay: Infinity,
    });
    this.timer.paused = true;

    this.scene.events.on("dropper.start", () => {
      console.log("DEBUG starting dropper");
      this.timer.paused = false;
      this.totalY = 0;
    });
  }

  collectMoney({ x, y }) {
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

  matsurisuDie({ x, y }) {
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

  collectPowerup({ x, y, target }) {
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

  collectEbifrion({ x, y, rotation }) {
    const ebifrion = this.scene.add
      .image(x, y, "items", 0)
      .setDepth(DEPTH.OBJECTDEPTH);
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
  }

  applyConfigsToSprites() {
    this.matsurisu.setVelocityY(this.modMatsurisu.fallSpeed);
    this.money.setVelocityY(this.modMoney.fallSpeed);
    this.powerup.setVelocityY(this.modPowerup.fallSpeed);
  }

  reloadState() {
    const newState = store.getState().stage;
    if (this.state === newState) return;

    const doConfigUpdates =
      this.state.matsurisu !== newState.matsurisu ||
      this.state.money !== newState.money;
    this.state = newState;

    if (doConfigUpdates) {
      this.applyModifiersToConfigs();
      this.applyConfigsToSprites();
    }
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
      this.matsurisuBuffer[0].deltaY <= matsurisuDeltaY
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
    }

    if (
      this.moneyBuffer.length > 0 &&
      this.moneyBuffer[0].y <= matsurisuTotalY
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
      this.powerupBuffer[0].y <= matsurisuTotalY
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
  }
}
