import Phaser from "phaser";
import Player from "../components/player";
import Dropper from "../components/dropper";
import sendTweet from "../twitter";
import { DEPTH, PLAYERHEIGHT, WIDTH } from "../globals";
import Scoreboard from "../components/scoreboard";
import { GameOver, PauseScreen, WinScreen } from "./uiscenes";
import store from "../store";
import { Powerup } from "../components/items/powerup";

const GAME_END_DELAY = 1000;
const EFFECT_FADE_DURATION = 5000;
const EFFECT_BLINK_DURATION = 500;

export default class Stage extends Phaser.Scene {
  createPlayerCollisions() {
    this.physics.add.overlap(
      this.matsuri.hitBox,
      this.dropper.matsurisu,
      (player, matsurisu) => {
        const coords = {
          x: matsurisu.body.x,
          y: matsurisu.body.y,
        };
        matsurisu.destroy();
        this.events.emit("matsurisu.catch", coords);
      }
    );

    this.physics.add.overlap(
      this.matsuri.hitBox,
      this.dropper.money,
      (player, money) => {
        const coords = {
          x: money.body.x,
          y: money.body.y,
        };
        money.destroy();
        this.events.emit("money.catch", coords);
      }
    );
  }

  createGroundCollisions() {
    const ground = this.add
      .rectangle(WIDTH / 2, PLAYERHEIGHT + 300, 720, 300)
      .setStrokeStyle(2, 0x00ff00);
    this.physics.add.existing(ground, true);

    this.physics.add.collider(
      ground,
      this.dropper.matsurisu,
      (ground, matsurisu) => {
        const coords = {
          x: matsurisu.body.x,
          y: matsurisu.body.y,
        };
        matsurisu.destroy();
        this.events.emit("matsurisu.drop", coords);
      }
    );

    this.physics.add.collider(ground, this.dropper.money, (ground, money) => {
      const coords = {
        x: money.body.x,
        y: money.body.y,
      };
      money.destroy();
      this.events.emit("money.drop", coords);
    });

    this.physics.add.collider(ground, this.matsuri.bodySprite);
  }

  create() {
    this.matsuri = new Player(this);
    this.dropper = new Dropper(this);
    this.scoreboard = new Scoreboard(this);
    this.effects = [];

    this.createPlayerCollisions();
    this.createGroundCollisions();

    this.events.once("global.gameOver", this.gameOver, this);

    this.events.once("dropper.done", () => {
      this.time.delayedCall(GAME_END_DELAY, this.winStage, undefined, this);
    });

    this.game.events.on("blur", this.pauseGame, this);

    this.events.emit("dropper.start");

    this.events.on("stage.addEffect", this.addEffect, this);

    // DEBUG start with powerup
    store.dispatch({
      type: "player.setPowerup",
      payload: new Powerup({
        name: "Float",
        target: "stage.matsurisu",
        frame: 1,
        modifier: { op: "multiply", fallSpeed: 0.5 },
        duration: 15,
      }),
    });

    const debugKey = this.input.keyboard.addKey("z", true, false);
    debugKey.on("down", () => {
      // POSTING TWEET
      // this.game.renderer.snapshotArea(200, 600, 300, 300, function (image) {
      //   const imgData = /base64,(.+)/.exec(image.src)[1];
      //   sendTweet(
      //     "Test tweet with media again",
      //     imgData,
      //     console.log,
      //     console.log
      //   );
      // });
    });
  }

  gameOver() {
    console.log("DEBUG game over");
    this.scene.pause(this.scene.key);
    this.scene.add("GameOver", GameOver);
    this.scene.launch("GameOver");
    this.scene.moveAbove("Stage", "GameOver");
  }

  pauseGame() {
    if (this.scene.isPaused(this.scene.key)) return;
    this.scene.add("PauseScreen", PauseScreen);
    this.scene.launch("PauseScreen");
    this.scene.pause(this.scene.key);
  }

  winStage() {
    this.scene.pause(this.scene.key);
    this.scene.add("WinScreen", WinScreen);
    this.scene.launch("WinScreen");
    this.scene.moveAbove("Stage", "WinScreen");
  }

  alignEffects() {
    Phaser.Actions.GridAlign(this.effects, {
      width: -1,
      height: 1,
      cellWidth: -110,
      cellHeight: 110,
      position: Phaser.Display.Align.CENTER,
      x: 660,
      y: 60,
    });
  }

  addEffect({ texture, frame, duration }) {
    const newEffect = this.add
      .image(0, 0, texture, frame)
      .setOrigin(0.5, 0.5)
      .setDepth(DEPTH.UIFRONT);
    this.effects.push(newEffect);
    this.alignEffects();
    this.time.delayedCall(duration - EFFECT_FADE_DURATION, () => {
      this.tweens.add({
        targets: newEffect,
        alpha: 0,
        yoyo: true,
        duration: EFFECT_BLINK_DURATION,
        repeat:
          Math.floor(EFFECT_FADE_DURATION / (EFFECT_BLINK_DURATION * 2)) - 1,
        onComplete: (blinkTween) => {
          this.tweens.remove(blinkTween);
          this.tweens.add({
            targets: newEffect,
            alpha: 0,
            duration: EFFECT_BLINK_DURATION,
            repeat: 0,
            onComplete: (fadeTween) => {
              this.tweens.remove(fadeTween);
              this.effects.splice(this.effects.indexOf(newEffect), 1);
              newEffect.destroy();
              this.alignEffects();
            },
          });
        },
      });
    });
  }

  update(time) {
    this.matsuri.update(time);
    this.dropper.update(time);
    this.scoreboard.update(time);
  }
}
