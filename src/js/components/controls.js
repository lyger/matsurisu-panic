import Phaser from "phaser";
import ButtonFactory from "./uibutton";
import { WIDTH, HEIGHT, DEPTH } from "../globals";
import store from "../store";

const ControlButton = ButtonFactory("controls");

const BOTTOM_MARGIN = 150;
const SIDE_MARGIN = 100;

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
      default: 0,
      down: 1,
      downCallback: () => (this._left = true),
      upCallback: () => (this._left = false),
    });
    this.rightButton = new ControlButton(scene, {
      x: WIDTH - SIDE_MARGIN,
      y: HEIGHT - BOTTOM_MARGIN,
      keys: ["d", "right"],
      default: 4,
      down: 5,
      downCallback: () => (this._right = true),
      upCallback: () => (this._right = false),
    });
    this.upButton = new ControlButton(scene, {
      x: WIDTH / 2,
      y: HEIGHT - BOTTOM_MARGIN - 75,
      keys: ["w", "up"],
      default: 8,
      down: 9,
      downCallback: () => (this._up = true),
      upCallback: () => (this._up = false),
    });
    this.downButton = new ControlButton(scene, {
      x: WIDTH / 2,
      y: HEIGHT - BOTTOM_MARGIN + 75,
      keys: ["s", "down"],
      default: 6,
      down: 7,
      downCallback: () => (this._down = true),
      upCallback: () => (this._down = false),
    });
    this.powerupButton = new ControlButton(scene, {
      x: WIDTH / 2,
      y: HEIGHT - BOTTOM_MARGIN,
      keys: ["space"],
      default: 2,
      down: 3,
      downCallback: () => this.usePowerup(),
    })
      .setVisible(false)
      .setActive(false);
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

    scene.add.existing(this);
  }

  refreshPowerup() {
    const state = store.getState();
    const powerup = state.player.powerup;
    if (powerup !== null) {
      this.powerupButton.setVisible(true).setActive(true);
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
      powerup.apply(this.scene);
      store.dispatch({ type: "player.clearPowerup" });
      this.powerupButton.setVisible(false).setActive(false);
      this.powerupIcon.setVisible(false);
    }
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
