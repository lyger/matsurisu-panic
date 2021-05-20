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
import Toggle from "../components/toggle";
import { BaseModal } from "./modal";

const HIGHSCORES_ENDPOINT =
  "https://onitools.moe/_matsurisu_panic_auth/highscores.json";

const ReturnButton = ButtonFactory("results-return-buttons", true);
const TweetButton = ButtonFactory("tweet-confirm-buttons", true);
const SelfWorldButton = ButtonFactory("results-self-world-buttons", true);

const SLIDE_DISTANCE = 100;
const SLIDE_DELAY = 400;
const SLIDE_DURATION = 800;

class TweetConfirmModal extends BaseModal {
  create({ parentSceneKey, imgData, score }) {
    super.create({ parentSceneKey, popup: false, closeButton: false });
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

    this.languageToggle = new Toggle(this, {
      texture: "tweet-language-buttons",
      x: WIDTH / 2,
      y: 545,
      spacing: 170,
      target: "settings.language",
      leftState: "ja",
      leftBase: 3,
      leftSelected: 2,
      rightBase: 1,
      rightSelected: 0,
      actionLeft: { type: "settings.setJapanese" },
      actionRight: { type: "settings.setEnglish" },
      toggleCallback: () => this.refreshDisplay(),
    });

    this.buttonNo = new TweetButton(this, {
      x: 230,
      y: 820,
      base: 0,
      over: 1,
      overSound: "menu-click",
      downSound: "menu-no",
      downSoundAdjustment: 0.5,
      downCallback: () => this.returnToParent({ hideTweetButton: false }),
    });

    this.buttonTweet = new TweetButton(this, {
      x: 490,
      y: 820,
      base: 2,
      over: 3,
      overSound: "menu-click",
      downSound: "menu-click",
      downCallback: () => this.handleTweet(),
    });

    this.doneTweeting = false;
    this.buttonOk = new TweetButton(this, {
      x: WIDTH / 2,
      y: 820,
      base: 4,
      over: 5,
      overSound: "menu-click",
      downSound: "menu-click",
      downCallback: () =>
        this.returnToParent({ hideTweetButton: this.doneTweeting }),
    }).show(false);

    this.refreshDisplay();
  }

  get fullTweetText() {
    const baseText = getMessage("TWEET").replace("[SCORE]", `${this.score}`);
    return `${baseText} http://example.com`;
  }

  refreshDisplay() {
    this.confirmText.setText(getMessage("CONFIRM_TWEET"));
    this.tweetText.setText(
      getMessage("TWEET").replace("[SCORE]", `${this.score}`)
    );
    this.scene.get(this.parentSceneKey).events.emit("rerender");
  }

  handleTweet() {
    this.buttonNo.show(false);
    this.buttonTweet.show(false);
    this.confirmText.setVisible(false);
    this.languageToggle.setVisible(false).setActive(false);
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

    if (this.state.score.stagesCleared === this.state.stage.maxLevel)
      this.sound.play("win-music", {
        volume: 0.5 * this.state.settings.volumeMusic,
        delay: SLIDE_DELAY / 1000,
      });

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

    this.worldButton = new SelfWorldButton(this, {
      x: 645,
      y: 1075,
      base: 0,
      over: 1,
      overSound: "menu-click",
      downSound: "menu-click",
      upCallback: () => this.showGlobalHighscores(),
    })
      .show(false)
      .setAlpha(0);

    this.selfButton = new SelfWorldButton(this, {
      x: 645,
      y: 1075,
      base: 2,
      over: 3,
      overSound: "menu-click",
      downSound: "menu-click",
      upCallback: () => this.showLocalHighscores(),
    }).show(false);

    this.time.delayedCall(secondaryDelay + 5 * 300, () => {
      this.worldButton.show(true).setAlpha(0);
      this.tweens.add({
        targets: this.worldButton,
        alpha: 1,
        duration: 300,
      });
    });

    this.topButton = new ReturnButton(this, {
      x: 225,
      y: 1190,
      base: 0,
      over: 1,
      overSound: "menu-click",
      downSound: "menu-click",
      upCallback: () => this.handleMainMenu(),
    });

    this.retryButton = new ReturnButton(this, {
      x: 495,
      y: 1190,
      base: 2,
      over: 3,
      overSound: "menu-click",
      downSound: "menu-click",
      upCallback: () => this.handleNewGame(),
    });

    store.dispatch({ type: "highscores.add", payload: this.finalScore });
    this.state = store.getState();

    this.showLocalHighscores(secondaryDelay);

    this.events.on("rerender", this.refreshDisplay, this);
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
    this.highscoresTitle?.destroy();
  }

  showLocalHighscores(delay = 0) {
    this.highscoresTitleMessage = "RESULTS_PERSONAL_BESTS";
    this.worldButton.show(true);
    this.selfButton.show(false);
    const highscores = this.state.highscores.highscores;
    const lastIndex = this.state.highscores.lastIndex;
    this.clearHighscores();
    this.createHighscores({
      delay,
      highscores,
      lastIndex,
      rowToText: ({ score, time }) => [`${score}`, timestampToDateString(time)],
    });
  }

  showGlobalHighscores(delay = 0) {
    this.highscoresTitleMessage = "RESULTS_WORLD_BESTS";
    this.worldButton.show(false);
    this.selfButton.show(true);
    this.clearHighscores();
    fetch(HIGHSCORES_ENDPOINT)
      .then((resp) => resp.json())
      .then(({ highscores }) => {
        this.createHighscores({
          delay,
          highscores,
          lastIndex: -1,
          rowToText: ({ score, name }) => [`${score}`, name],
        });
      })
      .catch((err) => this.showHighscoresError(err.toString().split(": ")));
  }

  showHighscoresError(details = []) {
    this.highscoresTitleMessage = "GENERIC_ERROR";
    const ERROR_STYLE = { ...TEXT_STYLE, fontSize: "36px", color: "#fc5854" };
    const DETAILS_STYLE = {
      ...RESULTS_TEXT_STYLE,
      fontSize: "24px",
      wordWrap: { width: 330, useAdvancedWrap: true },
    };
    this.highscoresTitle = this.add
      .text(WIDTH / 2, 875, getMessage("GENERIC_ERROR"), ERROR_STYLE)
      .setOrigin(0.5, 0.5)
      .setDepth(DEPTH.UIFRONT);
    this.highscoreElements = details.map((text, index) =>
      this.add
        .text(245, 950 + 50 * index, text, DETAILS_STYLE)
        .setDepth(DEPTH.UIFRONT)
        .setOrigin(0, 1)
    );
  }

  createHighscores({ delay, highscores, lastIndex, rowToText }) {
    const SCORE_STYLE = { ...RESULTS_TEXT_STYLE, fontSize: "32px" };
    const elements = [];

    this.highscoresTitle = this.add
      .text(WIDTH / 2, 875, getMessage(this.highscoresTitleMessage), {
        ...RESULTS_TEXT_STYLE,
        fontSize: "36px",
      })
      .setDepth(DEPTH.UIFRONT)
      .setOrigin(0.5, 0.5)
      .setAlpha(0);
    this.tweens.add({
      targets: this.highscoresTitle,
      alpha: 1,
      delay,
      duration: 500,
    });

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
        delay: delay + (index + 1) * 300,
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

  refreshDisplay() {
    this.highscoresTitle?.setText(getMessage(this.highscoresTitleMessage));
  }

  handleTweet() {
    this.scene.pause();
    this.scene.add("TweetConfirmModal", TweetConfirmModal, true, {
      parentSceneKey: this.scene.key,
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
