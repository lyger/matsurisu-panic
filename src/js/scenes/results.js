import Phaser from "phaser";
import {
  DEPTH,
  HEIGHT,
  RESULTS_TEXT_STYLE,
  TEXT_STYLE,
  WIDTH,
} from "../globals";
import store from "../store";
import ButtonFactory from "../components/uibutton";
import Stage from "./stage";
import { addCurtainsTransition } from "./curtains";
import sendTweet from "../twitter";
import { timestampToDateString } from "../utils";
import DebugCursor from "../components/debugcursor";

const Button = ButtonFactory("ui");
const ReturnButton = ButtonFactory("results-return-buttons");

const SLIDE_DISTANCE = 100;
const SLIDE_DELAY = 400;
const SLIDE_DURATION = 800;

export default class Results extends Phaser.Scene {
  create() {
    this.createUI();

    this.state = store.getState();
    this.counter = { score: this.state.score.score };
    this.finalScore = 0;
    this.imgData = "";

    const initialDelay = SLIDE_DELAY + SLIDE_DURATION;
    this.addBonus({
      y: 320,
      delay: initialDelay,
      duration: 500,
      value: this.state.score.score,
    });
    this.addBonus({
      y: 390,
      delay: initialDelay + 300,
      duration: 500,
      value: this.state.score.money,
      multiplier: this.state.score.results.moneyMultiplier,
    });
    this.addBonus({
      y: 460,
      delay: initialDelay + 600,
      duration: 500,
      value: this.state.score.lives,
      multiplier: this.state.score.results.livesMultiplier,
    });
    this.addBonus({
      y: 530,
      delay: initialDelay + 900,
      duration: 500,
      value: this.state.score.bestCombo,
      multiplier: this.state.score.results.bestComboMultiplier,
    });

    this.scoreText = this.add
      .text(400, 625, `${this.counter.score}`, {
        ...RESULTS_TEXT_STYLE,
        fontSize: "40px",
      })
      .setDepth(DEPTH.UIFRONT)
      .setOrigin(1, 0.5)
      .setAlpha(0);
    this.tweens.add({
      targets: this.counter,
      score: this.finalScore,
      delay: initialDelay + 1200,
      duration: 1500,
    });
    this.tweens.add({
      targets: this.scoreText,
      alpha: 1,
      delay: initialDelay + 1200,
      duration: 500,
    });

    const secondaryDelay = initialDelay + 3000;

    this.tweetButton = this.add
      .image(200, 750, "results-tweet-button")
      .setDepth(DEPTH.UIFRONT)
      .setAlpha(0);
    this.tweens.add({
      targets: this.tweetButton,
      alpha: 1,
      delay: secondaryDelay,
      duration: 500,
      onStart: () =>
        this.game.renderer.snapshotArea(0, 0, 720, 800, (image) => {
          this.imgData = /base64,(.+)/.exec(image.src)[1];
          console.log("DEBUG: Stored snapshot");
        }),
      onComplete: () => {
        this.tweetButton.setInteractive(this.input.makePixelPerfect());
        this.tweetButton.on("pointerdown", () =>
          console.log("TODO: Tweet confirm menu")
        );
      },
    });

    this.topButton = new ReturnButton(this, {
      x: 225,
      y: 1190,
      default: 0,
      over: 1,
      upCallback: () => console.log("TODO: Return to main menu"),
    });

    this.retryButton = new ReturnButton(this, {
      x: 495,
      y: 1190,
      default: 2,
      over: 3,
      upCallback: () => this.handleNewGame(),
    });

    this.add.existing(this.topButton);
    this.add.existing(this.retryButton);

    store.dispatch({ type: "highscores.add", payload: this.finalScore });

    this.createHighscores(secondaryDelay);

    // const debugButton = this.add
    //   .rectangle(WIDTH / 2, 1000, 500, 150, 0x0000ff)
    //   .setInteractive();
    // debugButton.on("pointerdown", () => {
    //   this.game.renderer.snapshotArea(200, 200, 500, 500, (image) => {
    //     const imgData = /base64,(.+)/.exec(image.src)[1];
    //     sendTweet(
    //       `Test tweet ${this.state.score.score}`,
    //       imgData,
    //       this.state.score.score,
    //       console.log,
    //       console.log
    //     );
    //   });
    // });
  }

  createUI() {
    this.add
      .image(WIDTH / 2, HEIGHT / 2, "results-background")
      .setDepth(DEPTH.BGBACK);
    this.illust = this.add
      .image(WIDTH / 2 + SLIDE_DISTANCE, HEIGHT / 2, "results-illustration")
      .setDepth(DEPTH.OBJECTDEPTH)
      .setAlpha(0);
    this.frames = this.add
      .image(WIDTH / 2 - SLIDE_DISTANCE, 475, "results-frames")
      .setDepth(DEPTH.UIBACK)
      .setAlpha(0);
    this.tweens.add({
      targets: [this.illust, this.frames],
      alpha: 1,
      x: WIDTH / 2,
      ease: "Quad.easeOut",
      delay: SLIDE_DELAY,
      duration: SLIDE_DURATION,
      repeat: 0,
    });
  }

  createHighscores(delay) {
    const SCORE_STYLE = { ...RESULTS_TEXT_STYLE, fontSize: "32px" };
    this.state = store.getState();
    this.state.highscores.highscores
      .slice(0, 4)
      .forEach(({ score, time }, index) => {
        const y = 950 + 50 * index;
        const scoreText = this.add
          .text(410, y, `${score}`, SCORE_STYLE)
          .setDepth(DEPTH.UIFRONT)
          .setOrigin(1, 1)
          .setAlpha(0);
        const dateText = this.add
          .text(560, y, timestampToDateString(time), RESULTS_TEXT_STYLE)
          .setDepth(DEPTH.UIFRONT)
          .setOrigin(1, 1)
          .setAlpha(0);
        if (index === this.state.highscores.lastIndex) {
          scoreText.setColor("#ff7366");
          dateText.setColor("#ff7366");
        }
        this.tweens.add({
          targets: [scoreText, dateText],
          alpha: 1,
          delay: delay + index * 300,
          duration: 500,
        });
      });
  }

  addBonus({ y, delay, duration, value, multiplier = 1 }) {
    this.finalScore += value * multiplier;
    const message = multiplier === 1 ? `${value}` : `${value} × ${multiplier}`;
    const text = this.add
      .text(350, y, message, RESULTS_TEXT_STYLE)
      .setDepth(DEPTH.UIFRONT)
      .setOrigin(1, 0.5)
      .setAlpha(0);
    this.tweens.add({
      targets: text,
      alpha: 1,
      delay,
      duration,
      repeat: 0,
    });
    return text;
  }

  handleNewGame() {
    store.dispatch({ type: "global.newGame" });
    addCurtainsTransition({
      scene: this,
      targetKey: "Stage",
      targetClass: Stage,
      duration: 1000,
    });
  }

  update() {
    this.scoreText.setText(this.counter.score.toFixed(0));
  }
}
