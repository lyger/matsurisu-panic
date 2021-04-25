import Phaser from "phaser";
import { DEPTH, HEIGHT, TEXT_STYLE, WIDTH } from "../globals";
import store from "../store";

const LABEL_OFFSET = -19;
const STATS_OFFSET = 10;
const LIVES_OFFSET_TOP = -15;
const LIVES_OFFSET_BOT = 11;

export default class Scoreboard extends Phaser.GameObjects.Container {
  constructor(scene, height) {
    super(scene);

    this.height = height;

    this.scene.add
      .image(WIDTH / 2, height, "stage-scoreboard")
      .setDepth(DEPTH.UIBACK);

    const TEXT_STYLE_SMALL = {
      ...TEXT_STYLE,
      fontSize: "18px",
    };

    const TEXT_STYLE_COMBO = {
      ...TEXT_STYLE,
      color: "#182538",
    };

    this.scoreLabel = this.scene.add
      .text(120, height + LABEL_OFFSET, "SCORE", TEXT_STYLE_SMALL)
      .setDepth(DEPTH.UIFRONT)
      .setOrigin(0.5, 0.5);
    this.moneyLabel = this.scene.add
      .text(610, height + LABEL_OFFSET, "MONEY", TEXT_STYLE_SMALL)
      .setDepth(DEPTH.UIFRONT)
      .setOrigin(0.5, 0.5);
    this.moneyYenSign = this.scene.add
      .text(565, height + STATS_OFFSET, "¥", TEXT_STYLE)
      .setDepth(DEPTH.UIFRONT)
      .setOrigin(0.5, 0.5);
    this.levelLabel = this.scene.add
      .text(278, height + LABEL_OFFSET + 4, "Lv", TEXT_STYLE_SMALL)
      .setDepth(DEPTH.UIFRONT)
      .setOrigin(0.5, 0.5);
    this.comboLabel = this.scene.add
      .text(WIDTH / 2, 475, "COMBO", { ...TEXT_STYLE_COMBO, fontSize: "48px" })
      .setDepth(DEPTH.BGFRONT)
      .setOrigin(0.5, 0.5)
      .setAlpha(0);

    this.scoreText = this.scene.add
      .text(120, height + STATS_OFFSET, "0", TEXT_STYLE)
      .setDepth(DEPTH.UIFRONT)
      .setOrigin(0.5, 0.5);
    this.moneyText = this.scene.add
      .text(680, height + STATS_OFFSET, "0", TEXT_STYLE)
      .setDepth(DEPTH.UIFRONT)
      .setOrigin(1, 0.5);
    this.levelText = this.scene.add
      .text(278, height + STATS_OFFSET, "1", TEXT_STYLE)
      .setDepth(DEPTH.UIFRONT)
      .setOrigin(0.5, 0.5);
    this.livesTop = this.scene.add.group();
    this.livesBot = this.scene.add.group();
    this.comboText = this.scene.add
      .text(WIDTH / 2, 575, "0", { ...TEXT_STYLE_COMBO, fontSize: "128px" })
      .setOrigin(0.5, 0.5)
      .setDepth(DEPTH.BGFRONT)
      .setAlpha(0);

    this.refreshState();
    this.addStageListeners();
  }

  addStageListeners() {
    this.scene.events.on("matsurisu.catch", ({ isLow }) => {
      store.dispatch({ type: "score.catch", payload: { isLow } });
      this.refreshState();
    });

    this.scene.events.on("money.catch", () => {
      store.dispatch({ type: "score.gainCoin" });
      this.refreshState();
    });

    this.scene.events.on("ebifrion.catch", () => {
      store.dispatch({ type: "score.catchEbifrion" });
      this.refreshState();
    });

    this.scene.events.on("matsurisu.drop", () => {
      store.dispatch({ type: "score.drop" });
      this.refreshState();
      if (this.state.lives == 0)
        return this.scene.events.emit("global.gameOver");
    });
    return this;
  }

  refreshLives() {
    const numLivesTop = Math.min(this.state.lives, 5);
    const numLivesBot = Math.max(this.state.lives - 5, 0);

    this.livesTop.clear(true, true);
    this.livesBot.clear(true, true);

    this.livesTop.createMultiple({
      key: "stage-scoreboard-life",
      quantity: numLivesTop,
      setXY: {
        x: 322,
        y: this.height + LIVES_OFFSET_TOP,
        stepX: 26.3,
      },
      setOrigin: {
        x: 0.5,
        y: 0.5,
      },
      setDepth: { value: DEPTH.UIFRONT },
    });

    if (numLivesBot < 1) return;
    this.livesBot.createMultiple({
      key: "stage-scoreboard-life",
      quantity: numLivesBot,
      setXY: {
        x: 335,
        y: this.height + LIVES_OFFSET_BOT,
        stepX: 26.3,
      },
      setOrigin: {
        x: 0.5,
        y: 0.5,
      },
      setDepth: { value: DEPTH.UIFRONT },
    });
    return this;
  }

  showCombos() {
    if (this.comboLabel.alpha > 0) return;
    this.scene.tweens.add({
      targets: [this.comboLabel, this.comboText],
      alpha: 1,
      repeat: 0,
      duration: 250,
    });
    return this;
  }

  hideCombos() {
    if (this.comboLabel.alpha === 0) return;
    this.comboLabel.setAlpha(0);
    this.comboText.setAlpha(0);
    return this;
  }

  refreshState() {
    const allState = store.getState();
    this.state = allState.score;
    if (this.state.combo >= this.state.minCombo) this.showCombos();
    else this.hideCombos();
    this.scoreText.setText(`${this.state.score}`);
    this.moneyText.setText(`${this.state.money}`);
    this.levelText.setText(`${allState.stage.level}`);
    this.comboText.setText(`${this.state.combo}`);
    this.refreshLives();
    return this;
  }
}
