import Phaser from "phaser";
import { DEPTH, HEIGHT, TEXT_STYLE, WIDTH } from "../globals";
import store from "../store";
import { addTextEffect } from "../utils";

const STATS_OFFSET = 55;
const LIVES_OFFSET_TOP = -15;
const LIVES_OFFSET_BOT = 11;
const COMBO_HEIGHT = 575;

export default class Scoreboard extends Phaser.GameObjects.Container {
  constructor(scene) {
    super(scene);

    this.scene.add
      .image(WIDTH / 2, 10, "stage-scoreboard")
      .setOrigin(0.5, 0)
      .setDepth(DEPTH.UIBACK);

    const TEXT_STYLE_COMBO = {
      ...TEXT_STYLE,
      color: "#182538",
    };

    this.moneyYenSign = this.scene.add
      .text(565, 1015, "¥", TEXT_STYLE)
      .setDepth(DEPTH.UIFRONT)
      .setOrigin(0.5, 0.5);
    this.comboLabel = this.scene.add
      .text(WIDTH / 2, 480, "COMBO", { ...TEXT_STYLE_COMBO, fontSize: "40px" })
      .setDepth(DEPTH.BGFRONT)
      .setOrigin(0.5, 0.5)
      .setAlpha(0);

    this.scoreText = this.scene.add
      .text(385, STATS_OFFSET, "0", TEXT_STYLE)
      .setDepth(DEPTH.UIFRONT)
      .setOrigin(0.5, 0.5);
    this.moneyText = this.scene.add
      .text(690, 1015, "0", TEXT_STYLE)
      .setDepth(DEPTH.UIFRONT)
      .setOrigin(1, 0.5);
    this.levelText = this.scene.add
      .text(278, STATS_OFFSET, "1", TEXT_STYLE)
      .setDepth(DEPTH.UIFRONT)
      .setOrigin(0.5, 0.5);
    this.livesTop = this.scene.add.group();
    this.livesBot = this.scene.add.group();
    this.comboText = this.scene.add
      .text(WIDTH / 2, COMBO_HEIGHT, "0", {
        ...TEXT_STYLE_COMBO,
        fontSize: "128px",
      })
      .setOrigin(0.5, 0.5)
      .setDepth(DEPTH.BGFRONT)
      .setAlpha(0);

    this.refreshState();
    this.addStageListeners();
  }

  addStageListeners() {
    this.scene.events.on("matsurisu.catch", ({ isLow, airborne }) => {
      store.dispatch({ type: "score.catch", payload: { isLow, airborne } });
      this.refreshState();
    });

    this.scene.events.on("money.catch", ({ airborne }) => {
      store.dispatch({ type: "score.catchCoin", payload: { airborne } });
      this.refreshState();
    });

    this.scene.events.on("ebifrion.catch", ({ airborne }) => {
      store.dispatch({ type: "score.catchEbifrion", payload: { airborne } });
      this.refreshState();
    });

    this.scene.events.on("powerup.catch", ({ airborne }) => {
      store.dispatch({ type: "score.catchPowerup", payload: { airborne } });
      this.refreshState();
    });

    this.scene.events.on("global.fullCombo", () => {
      store.dispatch({ type: "score.fullCombo" });
      const state = store.getState();
      addTextEffect(this.scene, {
        text: `FULL COMBO\n+${state.score.scorePerFullCombo}`,
        x: WIDTH / 2,
        y: COMBO_HEIGHT,
      });
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
        x: 292,
        y: 1003 + LIVES_OFFSET_TOP,
        stepX: 30,
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
        x: 305,
        y: 1003 + LIVES_OFFSET_BOT,
        stepX: 30,
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

  emphasizeCombos() {
    const effect1 = this.scene.add
      .text(WIDTH / 2, COMBO_HEIGHT, `${this.state.combo}`, {
        ...this.comboText.style,
        color: "#356e81",
      })
      .setOrigin(0.5, 0.5)
      .setDepth(DEPTH.BGFRONT + 1)
      .setAlpha(0.7);
    this.scene.tweens.add({
      targets: effect1,
      alpha: 0,
      scale: 1.75,
      duration: 400,
      repeat: 0,
      onComplete: () => effect1.destroy(),
    });
  }

  refreshState() {
    const oldCombo = this.state.combo;
    const allState = store.getState();
    this.state = allState.score;
    if (this.state.combo >= this.state.minCombo) this.showCombos();
    else this.hideCombos();
    this.scoreText.setText(`${this.state.score}`);
    this.moneyText.setText(`${this.state.money.toLocaleString("en-US")}`);
    this.levelText.setText(`${allState.stage.level}`);
    this.comboText.setText(`${this.state.combo}`);
    if (this.state.combo > oldCombo && this.state.combo % 5 === 0)
      this.emphasizeCombos();
    this.refreshLives();
    return this;
  }
}
