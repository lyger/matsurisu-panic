import Phaser from "phaser";
import {
  COMBO_TEXT_COLOR,
  DEPTH,
  FEVER_TEXT_COLOR,
  TEXT_STYLE,
  WIDTH,
} from "../globals";
import store from "../store";
import { addTextEffect } from "../utils";

const STATS_OFFSET = 55;
const LIVES_OFFSET_TOP = -15;
const LIVES_OFFSET_BOT = 11;
const COMBO_HEIGHT = 580;
const WHEEL_HEIGHT = 550;

const FEVER_TICKS = 24;
const FEVER_ARC = (2 * Math.PI) / FEVER_TICKS;
const FEVER_PHI = -Math.PI / 2 - FEVER_ARC / 2;

class FeverWheel extends Phaser.GameObjects.Container {
  constructor(scene, x, y) {
    super(scene, x, y);
    this.wheelFront = this.scene.add.image(0, 0, "fever-wheel-front");
    this.wheelBack = this.scene.add.image(0, 0, "fever-wheel-back");
    this.frontClip = this.scene.add.graphics().setVisible(false);
    this.backClip = this.scene.add.graphics().setVisible(false);
    this.wheelFront.mask = new Phaser.Display.Masks.BitmapMask(
      this.scene,
      this.frontClip
    );
    this.wheelBack.mask = new Phaser.Display.Masks.BitmapMask(
      this.scene,
      this.backClip
    );
    this.isCountdown = false;

    this.startTween = undefined;
    this.endTween = undefined;
    this.startValue = 0;
    this.endValue = 0;
    this.lastStartTicks = -1;
    this.lastEndTicks = -1;

    this.update();

    this.add([this.wheelFront, this.wheelBack, this.frontClip, this.backClip]);
    this.scene.add.existing(this);
  }

  setValue(value) {
    if (this.isCountdown) return;
    if (this.endTween !== undefined) {
      this.endTween.stop();
      this.scene.tweens.remove(this.endTween);
    }
    this.endTween = this.scene.tweens.add({
      targets: this,
      endValue: value,
      duration: 300,
      onUpdate: this.update,
      onUpdateScope: this,
    });
    if (value >= 1) this.startCountdown();
  }

  startCountdown() {
    this.isCountdown = true;
    const feverDuration = store.getState().stage.fever.duration;
    this.endTween = this.scene.tweens.add({
      targets: this,
      startValue: 1,
      duration: feverDuration * 1000,
      onUpdate: this.update,
      onUpdateScope: this,
    });
  }

  update() {
    const startTicks = Math.round(this.startValue * FEVER_TICKS);
    const endTicks = Math.round(this.endValue * FEVER_TICKS);
    if (startTicks === this.lastStartTicks && endTicks === this.lastEndTicks)
      return;
    this.lastStartTicks = startTicks;
    this.lastEndTicks = endTicks;
    this.frontClip
      .clear()
      .lineStyle(60, 0, 1)
      .beginPath()
      .arc(
        this.x,
        this.y,
        160,
        FEVER_PHI + startTicks * FEVER_ARC,
        FEVER_PHI + endTicks * FEVER_ARC,
        false
      )
      .strokePath()
      .closePath();
    this.backClip
      .clear()
      .lineStyle(60, 0, 1)
      .beginPath()
      .arc(
        this.x,
        this.y,
        160,
        FEVER_PHI + endTicks * FEVER_ARC,
        FEVER_PHI + 2 * Math.PI + startTicks * FEVER_ARC,
        false
      )
      .strokePath()
      .closePath();
  }
}

export default class Scoreboard extends Phaser.GameObjects.GameObject {
  constructor(scene) {
    super(scene, "Scoreboard");

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

    this.feverWheel = new FeverWheel(this.scene, WIDTH / 2, WHEEL_HEIGHT)
      .setVisible(false)
      .setDepth(DEPTH.BGFRONT);

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
      this.comboLabel.setColor(FEVER_TEXT_COLOR).setAlpha(0.8);
      this.comboText.setColor(FEVER_TEXT_COLOR).setAlpha(0.8);
      this.emphasizeText({
        text: "FEVER",
        x: WIDTH / 2,
        y: WHEEL_HEIGHT,
        depth: DEPTH.BGFRONT,
        visible: true,
        style: {
          ...TEXT_STYLE,
          color: FEVER_TEXT_COLOR,
          fontSize: "128px",
        },
      });
    });

    this.scene.events.on("global.feverEnd", () => {
      this.comboLabel.setColor(COMBO_TEXT_COLOR).setAlpha(0.4);
      this.comboText.setColor(COMBO_TEXT_COLOR).setAlpha(0.4);
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
    const feverCfg = allState.stage.fever;
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

    if (feverCfg.number > 0) {
      this.feverWheel.setVisible(true);
      this.feverWheel.setValue(this.state.fever / feverCfg.threshold);
    }

    return this;
  }
}
