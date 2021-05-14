import Phaser from "phaser";
import {
  COMBO_TEXT_COLOR,
  DEPTH,
  FEVER_TEXT_COLOR,
  HEIGHT,
  TEXT_STYLE,
  WIDTH,
} from "../globals";
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
      color: COMBO_TEXT_COLOR,
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

    this.feverText = this.scene.add
      .text(WIDTH / 2, COMBO_HEIGHT - 20, "FEVER", {
        ...TEXT_STYLE,
        fontSize: "128px",
        color: FEVER_TEXT_COLOR,
      })
      .setOrigin(0.5, 0.5)
      .setDepth(DEPTH.BGFRONT)
      .setAlpha(0.55)
      .setVisible(false);

    this.debugFever = this.scene.add
      .text(50, 550, "", TEXT_STYLE)
      .setOrigin(0.5, 0.5)
      .setDepth(DEPTH.OBJECTBACK);

    this.refreshState();
    this.addStageListeners();
  }

  addStageListeners() {
    this.scene.events.on(
      "matsurisu.catch",
      ({ isLow, isFever, airborne, x, y }) => {
        store.dispatch({
          type: "score.catchMatsurisu",
          payload: { isLow, airborne, isFever },
        });
        this.refreshState();
        if (isLow) {
          const multiplier = this.state.lowMultiplier;
          addTextEffect(this.scene, {
            x,
            y: y + 45,
            text: `LOW! x${multiplier}`,
          });
        }
        const airCount = this.maybeShowAirBonus(x, y);
        this.checkFever();
        this.scene.events.emit("sound.catch", {
          type: "matsurisu",
          isLow,
          airCount,
        });
      }
    );

    this.scene.events.on("coin.catch", ({ airborne, isFever, x, y }) => {
      store.dispatch({
        type: "score.catchCoin",
        payload: { airborne, isFever },
      });
      this.refreshState();
      const airCount = this.maybeShowAirBonus(x, y);
      this.checkFever();
      this.scene.events.emit("sound.catch", { type: "coin", airCount });
    });

    this.scene.events.on(
      "powerup.catch",
      ({ airborne, isFever, isRedundant, x, y }) => {
        store.dispatch({
          type: "score.catchPowerup",
          payload: { airborne, isFever, isRedundant },
        });
        this.refreshState();
        const airCount = this.maybeShowAirBonus(x, y);
        if (isRedundant)
          addTextEffect(this.scene, {
            x,
            y,
            text: `+${this.state.scorePerRedundantPowerup}`,
          });
        this.checkFever();
        this.scene.events.emit("sound.catch", {
          type: "powerup",
          airCount,
          isRedundant,
        });
      }
    );

    this.scene.events.on("ebifrion.catch", ({ airborne, x, y }) => {
      store.dispatch({ type: "score.catchEbifrion", payload: { airborne } });
      this.refreshState();
      addTextEffect(this.scene, {
        x,
        y,
        text: `+${this.state.scorePerEbifrion}`,
      });
      const airCount = this.maybeShowAirBonus(x, y);
      this.scene.events.emit("sound.catch", { type: "ebifrion", airCount });
    });

    this.scene.events.on("global.fullCombo", () => {
      store.dispatch({ type: "score.fullCombo" });
      this.refreshState();
      addTextEffect(this.scene, {
        x: WIDTH / 2,
        y: COMBO_HEIGHT - 165,
        text: `FULL COMBO\n+${this.state.scorePerFullCombo}`,
      });
    });

    this.scene.events.on("matsurisu.drop", ({ bonus }) => {
      store.dispatch({ type: "score.dropMatsurisu", payload: { bonus } });
      this.refreshState();
      if (this.state.lives == 0)
        return this.scene.events.emit("global.gameOver");
    });

    this.scene.events.on("coin.drop", () => {
      store.dispatch({ type: "score.dropCoin" });
      this.refreshState();
    });

    this.scene.events.on("powerup.drop", () => {
      store.dispatch({ type: "score.dropPowerup" });
      this.refreshState();
    });

    this.scene.events.on("ebifrion.drop", () => {
      store.dispatch({ type: "score.dropEbifrion" });
      this.refreshState();
    });

    this.scene.events.on("global.feverStart", () => {
      this.comboLabel.setVisible(false);
      this.comboText.setVisible(false);
      this.feverText.setVisible(true);
      let colorYellow = true;
      const feverEvent = this.scene.time.addEvent({
        delay: 500,
        loop: true,
        callback: () => {
          this.feverText.setColor(
            colorYellow ? COMBO_TEXT_COLOR : FEVER_TEXT_COLOR
          );
          colorYellow = !colorYellow;
        },
      });
      this.feverText.setData("event", feverEvent);
    });

    this.scene.events.on("global.feverTimeout", (duration) => {
      this.feverText.getData("event")?.destroy?.();
      const totalSecs = Math.floor(duration / 1000);
      const startAt = 1000 - Math.max(duration - totalSecs * 1000, 1);
      let counter = totalSecs;
      this.scene.time.addEvent({
        delay: 1000,
        repeat: totalSecs - 1,
        startAt,
        callback: () => {
          this.feverText.setText(`${counter}`);
          this.emphasizeText(this.feverText);
          counter--;
        },
      });
    });

    this.scene.events.on("global.feverEnd", () => {
      this.comboLabel.setVisible(true);
      this.comboText.setVisible(true);
      this.feverText.setVisible(false);
    });

    return this;
  }

  maybeShowAirBonus(x, y) {
    const counter = Math.max(this.state.airCounter - 1, 0);
    const airBonus = counter * this.state.bonusPerAir;
    if (airBonus > 0) {
      addTextEffect(this.scene, { x, y: y - 45, text: `AIR! +${airBonus}` });
    }
    return counter;
  }

  checkFever() {
    const feverConfig = store.getState().stage.fever;
    if (feverConfig.number > 0 && this.state.fever === feverConfig.threshold) {
      store.dispatch({ type: "score.resetFever" });
      this.scene.events.emit("global.feverStart");
      this.refreshState();
    }
  }

  refreshLives() {
    const numLivesTop = Math.min(this.state.lives, 5);
    const numLivesBot = Math.max(this.state.lives - 5, 0);

    this.livesTop.clear(true, true);
    this.livesBot.clear(true, true);

    if (numLivesTop < 1) return;

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
      alpha: 0.4,
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

  emphasizeText(textObject, style = {}) {
    if (!textObject.visible) return;
    const effect1 = this.scene.add
      .text(textObject.x, textObject.y, textObject.text, {
        ...textObject.style,
        ...style,
      })
      .setOrigin(0.5, 0.5)
      .setDepth(textObject.depth + 1)
      .setAlpha(0.7);
    this.scene.tweens.add({
      targets: effect1,
      alpha: 0,
      scale: 1.75,
      duration: 400,
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
      this.emphasizeText(this.comboText);
    this.refreshLives();

    this.debugFever.setText(`${this.state.fever}`);

    return this;
  }
}
