import ButtonFactory from "../components/uibutton";
import {
  DEPTH,
  HEIGHT,
  TEXT_STYLE,
  TITLE_BGM_VOLUME_FACTOR,
  WIDTH,
} from "../globals";
import store from "../store";
import { getMessage } from "../utils";
import BaseScene from "./base";
import { InstructionsModal, CreditsModal, SettingsModal } from "./modal";
import Stage from "./stage";

const FADE_DURATION = 600;
const START_DELAY = 600;
const START_BUTTONS_HEIGHT = HEIGHT - 145;
const CREDIT_BUTTON_HEIGHT = HEIGHT - 34;

const StartButton = ButtonFactory("title-start-buttons", true, {
  ...TEXT_STYLE,
  color: "#fff",
  fontSize: "50px",
});
const StartButtonAlt = ButtonFactory("title-start-buttons-alt", true, {
  ...TEXT_STYLE,
  color: "#fff",
  fontSize: "35px",
});
const SideButton = ButtonFactory("title-side-buttons", true);
const CreditButton = ButtonFactory("title-credit-buttons", true, {
  ...TEXT_STYLE,
  color: "#fff",
  fontSize: "28px",
});

export default class Title extends BaseScene {
  create() {
    this.createMusic();
    this.bgm.play();

    const endlessUnlocked = store.getState().settings.endlessUnlocked;

    let sideButtonOffset = 195;
    let startButtonX = WIDTH / 2;
    let StartButtonClass = StartButton;

    if (endlessUnlocked) {
      sideButtonOffset = 285;
      startButtonX = WIDTH / 2 - 110;
      StartButtonClass = StartButtonAlt;
      this.endlessButton = new StartButtonClass(this, {
        x: WIDTH / 2 + 110,
        y: START_BUTTONS_HEIGHT,
        base: 2,
        over: 3,
        text: getMessage("ENDLESS"),
        overTextStyle: { color: "#7f7f7f" },
        overSound: "menu-click",
        downSound: "menu-click",
        upCallback: () => this.startEndless(),
      }).setVisible(false);
    }

    const background = this.add
      .image(WIDTH / 2, HEIGHT / 2, "title-background")
      .setAlpha(0);
    this.tweens.add({
      targets: background,
      alpha: 1,
      duration: 500,
    });
    this.startButton = new StartButtonClass(this, {
      x: startButtonX,
      y: START_BUTTONS_HEIGHT,
      base: 0,
      over: 1,
      text: getMessage("START"),
      overTextStyle: { color: "#7f7f7f" },
      overSound: "menu-click",
      downSound: "menu-click",
      upCallback: () => this.startGame(),
    }).setVisible(false);
    this.settingsButton = new SideButton(this, {
      x: WIDTH / 2 - sideButtonOffset,
      y: START_BUTTONS_HEIGHT,
      base: 0,
      over: 1,
      overSound: "menu-click",
      downCallback: () =>
        this.scene.add("SettingsModal", SettingsModal, true, {
          parentSceneKey: this.scene.key,
        }),
    }).setVisible(false);
    this.controlsButton = new SideButton(this, {
      x: WIDTH / 2 + sideButtonOffset,
      y: START_BUTTONS_HEIGHT,
      base: 2,
      over: 3,
      overSound: "menu-click",
      downCallback: () =>
        this.scene.add("InstructionsModal", InstructionsModal, true, {
          parentSceneKey: this.scene.key,
        }),
    }).setVisible(false);
    this.creditsButton = new CreditButton(this, {
      x: WIDTH / 2,
      y: CREDIT_BUTTON_HEIGHT,
      text: getMessage("CREDITS"),
      downCallback: () =>
        this.scene.add("CreditsModal", CreditsModal, true, {
          parentSceneKey: this.scene.key,
        }),
    }).setVisible(false);

    this.createContrail({
      texture: "title-matsurisu1",
      x: 110,
      y: 840,
      steps: 6,
      deltaX: 150,
      deltaY: 800,
      deltaRotation: -0.7 * Math.PI,
      delay: START_DELAY,
      interval: 150,
      duration: FADE_DURATION,
    });
    this.createContrail({
      texture: "title-matsuri",
      x: 490,
      y: 725,
      steps: 4,
      deltaX: -400,
      deltaY: 200,
      delay: START_DELAY + 300,
      interval: 150,
      duration: FADE_DURATION,
    });
    this.ebifrion = this.createContrail({
      texture: "title-ebifrion",
      x: 0,
      y: 335,
      scale: 0.88,
      rotation: 0.047 * Math.PI,
      delay: START_DELAY + 900,
      duration: FADE_DURATION,
    });
    this.ebifrion = this.createContrail({
      texture: "title-matsurisu2",
      x: 630,
      y: 75,
      delay: START_DELAY + 900,
      duration: FADE_DURATION,
    });
    this.ebifrion = this.createContrail({
      texture: "title-matsurisu3",
      x: 70,
      y: 150,
      delay: START_DELAY + 900,
      duration: FADE_DURATION,
    });
    this.ebifrion = this.createContrail({
      texture: "title-logo",
      x: WIDTH / 2 + 10,
      y: 260,
      depth: DEPTH.UIFRONT,
      delay: START_DELAY + 900,
      duration: FADE_DURATION,
    });
    this.time.delayedCall(START_DELAY + 900, () => {
      this.add.image(WIDTH / 2, HEIGHT / 2, "title-sparkles");
      this.startButton.setVisible(true);
      this.settingsButton.setVisible(true);
      this.controlsButton.setVisible(true);
      this.creditsButton.setVisible(true);
      this.endlessButton?.setVisible(true);
    });

    this.events.on("rerender", this.refresh, this);
  }

  createMusic() {
    const volumeMusic = store.getState().settings.volumeMusic;
    this.bgm = this.sound.add("title-music", {
      loop: true,
      volume: TITLE_BGM_VOLUME_FACTOR * volumeMusic,
    });
    this.events.once("destroy", () => {
      this.bgm?.stop?.();
      this.bgm?.destroy?.();
    });
  }

  fadeBgm() {
    this.tweens.add({
      targets: this.bgm,
      volume: 0,
      duration: 800,
      onComplete: () => this.bgm.stop(),
    });
  }

  createContrail({
    texture,
    x,
    y,
    scale = 1,
    rotation = 0,
    steps = 0,
    delay = 0,
    interval = 0,
    duration,
    depth = DEPTH.OBJECTDEPTH,
    deltaX = 0,
    deltaY = 0,
    deltaRotation = 0,
  }) {
    const startX = x - deltaX;
    const startY = y - deltaY;
    const startRotation = rotation - deltaRotation;
    const stepX = steps === 0 ? 0 : deltaX / steps;
    const stepY = steps === 0 ? 0 : deltaY / steps;
    const stepRotation = steps === 0 ? 0 : deltaRotation / steps;
    const newGroup = this.add.group({
      key: texture,
      quantity: steps + 1,
      setXY: { x: startX, y: startY, stepX, stepY },
      setScale: { x: scale, y: scale },
      setRotation: { value: startRotation, step: stepRotation },
      setOrigin: { x: 0.5, y: 0.5 },
      setDepth: { value: depth, step: 1 },
      setAlpha: { value: 0 },
    });
    const newItem = this.add
      .image(x, y, texture)
      .setRotation(rotation)
      .setScale(scale)
      .setDepth(depth + steps - 1)
      .setAlpha(0);
    newGroup.getChildren().forEach((child, index) => {
      child.setTintFill(0xffffff);
      this.time.delayedCall(delay + index * interval, () => {
        child.setAlpha(1);
        if (index === steps) {
          newItem.setAlpha(1);
          this.tweens.add({
            targets: child,
            alpha: 0,
            duration,
            onComplete: () => newGroup.destroy(true, true),
          });
        } else {
          this.tweens.add({
            targets: child,
            alpha: 0,
            duration,
          });
        }
      });
    });
    return newItem;
  }

  refresh() {
    const volumeMusic = store.getState().settings.volumeMusic;
    this.bgm.setVolume(TITLE_BGM_VOLUME_FACTOR * volumeMusic);
    this.startButton.setText(getMessage("START"));
    this.creditsButton.setText(getMessage("CREDITS"));
    this.endlessButton?.setText(getMessage("ENDLESS"));
  }

  startGame() {
    store.dispatch({ type: "global.newGame" });
    this.fadeBgm();
    this.curtainsTo("Stage", Stage);
  }

  startEndless() {
    store.dispatch({ type: "global.newGame" });
    store.dispatch({ type: "global.activateEndless" });
    this.fadeBgm();
    this.curtainsTo("Stage", Stage);
  }
}
