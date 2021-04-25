import Phaser from "phaser";
import ButtonFactory from "./uibutton";
import { WIDTH, HEIGHT, DEPTH } from "../globals";
import store from "../store";

const ControlButton = ButtonFactory("controls");
const ControlButtonBig = ButtonFactory("controls-big");

const BOTTOM_MARGIN = 166;
const VERTICAL_OFFSET = 142;
const SIDE_MARGIN = 128;

export default class Controls extends Phaser.GameObjects.Container {
  constructor(scene) {
    super(scene);

    this._left = false;
    this._right = false;
    this._up = false;
    this._down = false;
    this.leftButton = new ControlButton(scene, {
      x: SIDE_MARGIN,
      y: HEIGHT - BOTTOM_MARGIN,
      keys: ["a", "left"],
      default: 1,
      down: 5,
      downCallback: () => (this._left = true),
      upCallback: () => (this._left = false),
    });
    this.rightButton = new ControlButton(scene, {
      x: WIDTH - SIDE_MARGIN,
      y: HEIGHT - BOTTOM_MARGIN,
      keys: ["d", "right"],
      default: 0,
      down: 4,
      downCallback: () => (this._right = true),
      upCallback: () => (this._right = false),
    });
    this.upButton = new ControlButton(scene, {
      x: WIDTH / 2,
      y: HEIGHT - BOTTOM_MARGIN - VERTICAL_OFFSET,
      keys: ["w", "up"],
      default: 2,
      down: 6,
      downCallback: () => (this._up = true),
      upCallback: () => (this._up = false),
    });
    this.downButton = new ControlButton(scene, {
      x: WIDTH / 2,
      y: HEIGHT - BOTTOM_MARGIN + VERTICAL_OFFSET,
      keys: ["s", "down"],
      default: 3,
      down: 7,
      downCallback: () => (this._down = true),
      upCallback: () => (this._down = false),
    });
    this.powerupButton = new ControlButtonBig(scene, {
      x: WIDTH / 2,
      y: HEIGHT - BOTTOM_MARGIN,
      keys: ["space"],
      default: 0,
      down: 1,
      downCallback: () => this.usePowerup(),
    })
      .setActive(false)
      .setFrame(1);
    this.powerupIcon = scene.add
      .image(WIDTH / 2, HEIGHT - BOTTOM_MARGIN, "powerups")
      .setOrigin(0.5, 0.5)
      .setDepth(DEPTH.UIFRONT + 1)
      .setVisible(false);

    this.add([
      this.leftButton,
      this.rightButton,
      this.upButton,
      this.downButton,
      this.powerupButton,
    ]);

    this.refreshPowerup();
    scene.add.existing(this);
  }

  refreshPowerup() {
    const state = store.getState();
    const powerup = state.player.powerup;
    if (powerup !== null) {
      this.powerupButton
        .setActive(true)
        .setFrame(this.powerupButton.config.default);
      this.powerupIcon
        .setTexture(powerup.texture)
        .setFrame(powerup.frame)
        .setVisible(true);
    }
  }

  usePowerup() {
    const state = store.getState();
    const powerup = state.player.powerup;
    if (powerup !== null) {
      const success = powerup.apply(this.scene);
      if (success) {
        store.dispatch({ type: "player.clearPowerup" });
        this.powerupButton.setActive(false);
        this.powerupIcon.setVisible(false);
      }
    }
  }

  disable() {
    this.leftButton.setActive(false);
    this.rightButton.setActive(false);
    this.upButton.setActive(false);
    this.downButton.setActive(false);
    this.powerupButton.setActive(false);
  }

  enable() {
    this.leftButton.setActive(true);
    this.rightButton.setActive(true);
    this.upButton.setActive(true);
    this.downButton.setActive(true);
    this.powerupButton.setActive(true);
  }

  get left() {
    return this._left;
  }

  get right() {
    return this._right;
  }

  get up() {
    return this._up;
  }

  get down() {
    return this._down;
  }
}
