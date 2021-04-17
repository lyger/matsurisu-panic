import Phaser from "phaser";
import { DEPTH } from "../globals";
import store from "../store";
import { applyModifiersToState } from "../utils";

function euclidean(x, y) {
  return Math.sqrt(Math.pow(x, 2) + Math.pow(y, 2));
}

export default class Dropper extends Phaser.GameObjects.Group {
  constructor(scene) {
    super(scene);

    this.state = store.getState().stage;
    this.applyModifiersToConfigs();

    this.matsurisu = scene.physics.add.group();
    this.money = scene.physics.add.group();
    this.powerups = scene.physics.add.group();

    this.add(this.matsurisu);
    this.add(this.money);
    this.add(this.powerups);

    this.generateItems();

    this.createTimer();

    const checkFinished = () => {
      if (this.matsurisuBuffer.length > 0) return;
      if (this.moneyBuffer.length > 0) return;
      if (this.matsurisu.countActive() > 0) return;
      if (this.money.countActive() > 0) return;
      scene.events.emit("dropper.done");
    };

    scene.events.on("matsurisu.catch", checkFinished);
    scene.events.on("matsurisu.drop", checkFinished);
    scene.events.on("money.catch", checkFinished);
    scene.events.on("money.drop", checkFinished);
  }

  generateItems() {
    const matsurisuCfg = this.modMatsurisu;
    const moneyCfg = this.modMoney;

    const rand = Phaser.Math.RND;

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

    this.moneyBuffer = [];

    const numMoney = rand.between(moneyCfg.minNumber, moneyCfg.maxNumber);

    for (let i = 0; i < numMoney; i++) {
      this.moneyBuffer.push({
        y: rand.between(0, totalY),
        x: rand.between(moneyCfg.minX, moneyCfg.maxX),
      });
    }

    this.moneyBuffer.sort((a, b) => a.y - b.y);
  }

  applyModifiersToConfigs() {
    this.modMatsurisu = applyModifiersToState(this.state.matsurisu);
    this.modMoney = applyModifiersToState(this.state.money);
  }

  applyConfigsToSprites() {
    this.matsurisu.setVelocityY(this.modMatsurisu.fallSpeed);
    this.money.setVelocityY(this.modMoney.fallSpeed);
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

  createTimer() {
    this.timer = this.scene.time.addEvent({
      delay: Infinity,
    });
    this.timer.paused = true;

    this.scene.events.on("dropper.start", () => {
      console.log("DEBUG starting dropper");
      this.timer.paused = false;
    });
  }

  update(time) {
    this.reloadState();
    const rand = Phaser.Math.RND;
    const delta = this.timer.elapsed;
    const matsurisuDeltaY =
      ((delta - this.matsurisuLastSpawn) / 1000) * this.modMatsurisu.fallSpeed;
    const matsurisuTotalY = (delta / 1000) * this.modMatsurisu.fallSpeed;

    if (
      this.matsurisuBuffer.length > 0 &&
      this.matsurisuBuffer[0].deltaY <= matsurisuDeltaY
    ) {
      const next = this.matsurisuBuffer.shift();
      this.matsurisuLastSpawn = delta;

      this.matsurisu
        .create(next.x, -100, "matsurisu-normal", 0, true, true)
        .setSize(105, 90)
        .setDepth(DEPTH.OBJECTDEPTH)
        .setVelocityY(this.modMatsurisu.fallSpeed)
        .setFlip(rand.frac() > 0.5, rand.frac() > 0.5)
        .anims.play("matsurisu-normal.fall");
    }

    if (
      this.moneyBuffer.length > 0 &&
      this.moneyBuffer[0].y <= matsurisuTotalY
    ) {
      const next = this.moneyBuffer.shift();

      this.money
        .create(next.x, -100, "powerups", 0, true, true)
        .setSize(60, 60)
        .setOffset(20, 20)
        .setDepth(DEPTH.OBJECTDEPTH)
        .setVelocityY(this.modMoney.fallSpeed);
    }
  }
}
