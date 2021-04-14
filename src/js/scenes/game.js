import Phaser from "phaser";
import Player from "../components/player";
import Dropper from "../components/dropper";
import sendTweet from "../twitter";
import { PLAYERHEIGHT, WIDTH } from "../globals";
import Scoreboard from "../components/scoreboard";
import { GameOver, WinScreen } from "./uiscenes";

const GAME_END_DELAY = 1000;

export default class Game extends Phaser.Scene {
  constructor() {
    super("Game");
  }

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
      .rectangle(WIDTH / 2, PLAYERHEIGHT + 250, 720, 300)
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

  gameOver() {
    console.log("DEBUG game over");
    this.scene.pause(this.scene.key);
    this.scene.add("GameOver", GameOver);
    this.scene.launch("GameOver");
    this.scene.moveAbove("Game", "GameOver");
  }

  winGame() {
    this.scene.pause(this.scene.key);
    this.scene.add("WinScreen", WinScreen);
    this.scene.launch("WinScreen");
    this.scene.moveAbove("Game", "WinScreen");
  }

  create() {
    this.matsuri = new Player(this);
    this.dropper = new Dropper(this);
    this.scoreboard = new Scoreboard(this);

    this.createPlayerCollisions();
    this.createGroundCollisions();

    this.events.once("global.gameOver", this.gameOver, this);

    this.events.once("dropper.done", () => {
      this.time.delayedCall(GAME_END_DELAY, this.winGame, undefined, this);
    });

    this.events.emit("dropper.start");

    const debugKey = this.input.keyboard.addKey("z", true, false);
    debugKey.on("down", () => {
      // POSTING TWEET
      // this.game.renderer.snapshotArea(250, 500, 220, 280, function (image) {
      //   const imgData = /base64,(.+)/.exec(image.src)[1];
      //   console.log(imgData);
      //   sendTweet(
      //     "Test tweet with media",
      //     imgData,
      //     console.log,
      //     console.log
      //   );
      // });
      // RESETTING SCENE
      // this.registry.destroy();
      // this.gameEvents.off();
      // this.scene.restart();
    });
  }

  update(time) {
    this.matsuri.update(time);
    this.dropper.update(time);
    this.scoreboard.update(time);
  }
}
