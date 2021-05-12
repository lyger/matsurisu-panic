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
import sendTweet from "../twitter";
import { getMessage, timestampToDateString } from "../utils";
import Title from "./title";
import BaseScene from "./base";

const HIGHSCORES_ENDPOINT =
  "https://onitools.moe/_matsurisu_panic_auth/highscores.json";

const ReturnButton = ButtonFactory("results-return-buttons", true);
const TweetButton = ButtonFactory("tweet-confirm-buttons", true);

const SLIDE_DISTANCE = 100;
const SLIDE_DELAY = 400;
const SLIDE_DURATION = 800;

class TweetConfirmModal extends Phaser.Scene {
  create({ imgData, score }) {
    const cover = this.add
      .rectangle(WIDTH / 2, HEIGHT / 2, WIDTH, HEIGHT, 0x000000, 0.5)
      .setDepth(DEPTH.BGBACK)
      .setInteractive();
    cover.on("pointerdown", () => this.returnToResults());
    this.add
      .image(WIDTH / 2, HEIGHT / 2, "tweet-confirm-modal")
      .setDepth(DEPTH.UIBACK)
      .setOrigin(0.5, 0.5)
      .setInteractive(this.input.makePixelPerfect());

    this.state = store.getState();
    this.imgData = imgData;
    this.score = score;

    this.confirmText = this.add
      .text(WIDTH / 2, 475, "", {
        ...RESULTS_TEXT_STYLE,
        fontSize: "32px",
      })
      .setOrigin(0.5, 0.5)
      .setDepth(DEPTH.UIFRONT);
    this.tweetText = this.add
      .text(WIDTH / 2, 665, "", {
        ...RESULTS_TEXT_STYLE,
        fontSize: "32px",
        align: "center",
        wordWrap: { width: 580, useAdvancedWrap: true },
      })
      .setOrigin(0.5, 0.5)
      .setDepth(DEPTH.UIFRONT);

    this.englishButton = this.add
      .image(275, 545, "tweet-language-buttons", 0)
      .setDepth(DEPTH.UIFRONT);
    this.japaneseButton = this.add
      .image(445, 545, "tweet-language-buttons", 2)
      .setDepth(DEPTH.UIFRONT);
    this.englishButton.on("pointerdown", () => {
      store.dispatch({ type: "settings.setEnglish" });
      this.refreshDisplay();
    });
    this.japaneseButton.on("pointerdown", () => {
      store.dispatch({ type: "settings.setJapanese" });
      this.refreshDisplay();
    });

    this.buttonNo = new TweetButton(this, {
      x: 230,
      y: 820,
      base: 0,
      over: 1,
      downCallback: () => this.returnToResults(),
    });

    this.buttonTweet = new TweetButton(this, {
      x: 490,
      y: 820,
      base: 2,
      over: 3,
      downCallback: () => this.handleTweet(),
    });

    this.doneTweeting = false;
    this.buttonOk = new TweetButton(this, {
      x: WIDTH / 2,
      y: 820,
      base: 4,
      over: 5,
      downCallback: () => this.returnToResults(this.doneTweeting),
    }).show(false);

    this.add.existing(this.buttonNo);
    this.add.existing(this.buttonTweet);
    this.add.existing(this.buttonOk);

    this.refreshDisplay();
  }

  get fullTweetText() {
    const baseText = getMessage("TWEET").replace("[SCORE]", `${this.score}`);
    return `${baseText} http://example.com`;
  }

  refreshDisplay() {
    this.state = store.getState();
    this.confirmText.setText(getMessage("CONFIRM_TWEET"));
    this.tweetText.setText(
      getMessage("TWEET").replace("[SCORE]", `${this.score}`)
    );
    if (this.state.settings.language === "ja") {
      this.englishButton.setFrame(1).setInteractive();
      this.japaneseButton.setFrame(2).disableInteractive();
    } else {
      this.englishButton.setFrame(0).disableInteractive();
      this.japaneseButton.setFrame(3).setInteractive();
    }
  }

  returnToResults(hideTweetButton = false) {
    this.scene.resume("Results", { hideTweetButton });
    this.scene.remove(this.scene.key);
  }

  handleTweet() {
    this.buttonNo.show(false);
    this.buttonTweet.show(false);
    this.confirmText.setVisible(false);
    this.englishButton.setVisible(false).setActive(false);
    this.japaneseButton.setVisible(false).setActive(false);
    this.tweetText.setText(getMessage("TWEET_PROGRESS"));
    sendTweet(
      this.fullTweetText,
      this.imgData,
      this.score,
      this.handleSuccess.bind(this),
      this.handleFailure.bind(this)
    );
  }

  handleSuccess({ url }) {
    this.confirmText.setVisible(true).setText(getMessage("TWEET_SUCCESS"));
    this.tweetText.setText(url);
    const clickArea = this.add
      .rectangle(WIDTH / 2, 665, 580, 150, 0x000000, 0)
      .setDepth(DEPTH.UIFRONT + 1)
      .setInteractive();
    clickArea.on("pointerup", () => window.open(url, "_blank"));
    this.doneTweeting = true;
    this.buttonOk.show(true);
  }

  handleFailure(err) {
    console.log(err);
    this.tweetText.setText(getMessage("TWEET_FAILURE"));
    this.buttonOk.show(true);
  }
}

export default class Results extends BaseScene {
  create() {
    this.state = store.getState();
    this.createUI();

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
      .text(400, 623, `${this.counter.score}`, {
        ...RESULTS_TEXT_STYLE,
        fontSize: "48px",
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
        }),
      onComplete: () => {
        this.tweetButton.setInteractive(this.input.makePixelPerfect());
        this.tweetButton.on("pointerdown", () => this.handleTweet());
      },
    });

    this.events.on("resume", (_, { hideTweetButton }) => {
      if (hideTweetButton)
        this.tweetButton.setVisible(false).disableInteractive();
    });

    this.topButton = new ReturnButton(this, {
      x: 225,
      y: 1190,
      base: 0,
      over: 1,
      upCallback: () => this.handleMainMenu(),
    });

    this.retryButton = new ReturnButton(this, {
      x: 495,
      y: 1190,
      base: 2,
      over: 3,
      upCallback: () => this.handleNewGame(),
    });

    this.add.existing(this.topButton);
    this.add.existing(this.retryButton);

    store.dispatch({ type: "highscores.add", payload: this.finalScore });
    this.state = store.getState();

    this.showLocalHighscores(secondaryDelay);
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
    });
    const levelFrame = this.add
      .container(WIDTH / 2, 130, [
        new Phaser.GameObjects.Image(this, 0, 0, "results-level"),
        new Phaser.GameObjects.Text(
          this,
          85,
          -1,
          `${this.state.score.stagesCleared}`,
          {
            ...TEXT_STYLE,
            color: "#fff",
            fontSize: "35px",
          }
        )
          .setDepth(1)
          .setOrigin(0.5, 0.5),
      ])
      .setDepth(DEPTH.UIBACK)
      .setAlpha(0);
    this.tweens.add({
      targets: levelFrame,
      alpha: 1,
      y: 180,
      ease: "Quad.easeOut",
      delay: SLIDE_DELAY,
      duration: SLIDE_DURATION,
    });
  }

  clearHighscores() {
    this.highscoreElements?.forEach((obj) => obj.destroy());
    this.highscoreElements = [];
  }

  showLocalHighscores(delay = 0) {
    const highscores = this.state.highscores.highscores;
    const lastIndex = this.state.highscores.lastIndex;
    this.clearHighscores();
    this.createHighscores(delay, highscores, lastIndex, ({ score, time }) => [
      `${score}`,
      timestampToDateString(time),
    ]);
  }

  showGlobalHighscores(delay = 0) {
    this.clearHighscores();
    fetch(HIGHSCORES_ENDPOINT)
      .then((resp) => resp.json())
      .then(({ highscores }) => {
        this.createHighscores(delay, highscores, -1, ({ score, name }) => [
          `${score}`,
          name,
        ]);
      })
      .catch(() => this.showHighscoresError());
  }

  showHighscoresError() {
    const ERROR_STYLE = { ...TEXT_STYLE, fontSize: "32px", color: "#fc5854" };
    const errorText = this.add
      .text(WIDTH / 2, 950, getMessage("GENERIC_ERROR"), ERROR_STYLE)
      .setOrigin(0.5, 0.5)
      .setDepth(DEPTH.UIFRONT);
    this.highscoreElements = [errorText];
  }

  createHighscores(delay, highscores, lastIndex, rowToText) {
    const SCORE_STYLE = { ...RESULTS_TEXT_STYLE, fontSize: "32px" };
    const elements = [];

    highscores.slice(0, 4).forEach((row, index) => {
      const [text1, text2] = rowToText(row);
      const y = 950 + 50 * index;

      const primaryText = this.add
        .text(410, y, text1, SCORE_STYLE)
        .setDepth(DEPTH.UIFRONT)
        .setOrigin(1, 1)
        .setAlpha(0);
      const secondaryText = this.add
        .text(560, y, text2, RESULTS_TEXT_STYLE)
        .setDepth(DEPTH.UIFRONT)
        .setOrigin(1, 1)
        .setAlpha(0);

      const targets = [primaryText, secondaryText];
      elements.push(primaryText, secondaryText);

      if (index === lastIndex) {
        primaryText.setColor("#fc5854");
        secondaryText.setColor("#fc5854");
        const newBadge = this.add
          .image(160, y, "results-new")
          .setOrigin(0.5, 1)
          .setDepth(DEPTH.UIFRONT)
          .setAlpha(0);
        targets.push(newBadge);
        elements.push(newBadge);
      }

      this.tweens.add({
        targets,
        alpha: 1,
        delay: delay + index * 300,
        duration: 500,
      });
    });

    this.highscoreElements = elements;
  }

  addBonus({ y, delay, duration, value, multiplier = 1 }) {
    this.finalScore += value * multiplier;
    const message =
      value === 0
        ? "—"
        : multiplier === 1
        ? `${value}`
        : `${value} × ${multiplier}`;
    const text = this.add
      .text(355, y, message, RESULTS_TEXT_STYLE)
      .setDepth(DEPTH.UIFRONT)
      .setOrigin(1, 0.5)
      .setAlpha(0);
    this.tweens.add({
      targets: text,
      alpha: 1,
      delay,
      duration,
    });
    return text;
  }

  handleTweet() {
    this.scene.pause(this.scene.key);
    this.scene.add("TweetConfirmModal", TweetConfirmModal, true, {
      imgData: this.imgData,
      score: this.finalScore,
    });
  }

  handleNewGame() {
    store.dispatch({ type: "global.newGame" });
    this.curtainsTo("Stage", Stage);
  }

  handleMainMenu() {
    store.dispatch({ type: "global.newGame" });
    this.curtainsTo("Title", Title);
  }

  update() {
    this.scoreText.setText(this.counter.score.toFixed(0));
  }
}