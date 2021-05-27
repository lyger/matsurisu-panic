import Phaser from "phaser";
import ButtonFactory from "./uibutton";
import { WIDTH, HEIGHT, DEPTH } from "../globals";
import store from "../store";

const ControlButtonHorizontal = ButtonFactory("controls-horizontal");
const ControlButtonVertical = ButtonFactory("controls-vertical");
const ControlButtonItem = ButtonFactory("controls-item");

const EQUIPMENT_LEFT = 48;
const EQUIPMENT_Y = 1001;
const EQUIPMENT_INTERVAL = 75;

export default class Controls extends Phaser.GameObjects.Container {
  constructor(scene) {
    super(scene);

    this._left = false;
    this._right = false;
    this._up = false;
    this._down = false;

    this.leftButton = new ControlButtonHorizontal(scene, {
      x: 70,
      y: HEIGHT - 115,
      keys: ["a", "left"],
      base: 2,
      down: 3,
      allowHoldIn: true,
      downCallback: () => (this._left = true),
      upCallback: () => (this._left = false),
    });
    this.rightButton = new ControlButtonHorizontal(scene, {
      x: 210,
      y: HEIGHT - 115,
      keys: ["d", "right"],
      base: 0,
      down: 1,
      allowHoldIn: true,
      downCallback: () => (this._right = true),
      upCallback: () => (this._right = false),
    });
    this.upButton = new ControlButtonVertical(scene, {
      x: WIDTH - 140,
      y: HEIGHT - 172.5,
      keys: ["w", "up"],
      base: 0,
      down: 1,
      allowHoldIn: true,
      downCallback: () => (this._up = true),
      upCallback: () => (this._up = false),
    });
    this.downButton = new ControlButtonVertical(scene, {
      x: WIDTH - 140,
      y: HEIGHT - 57.5,
      keys: ["s", "down"],
      base: 2,
      down: 3,
      allowHoldIn: true,
      downCallback: () => (this._down = true),
      upCallback: () => (this._down = false),
    });
    this.powerupButton = new ControlButtonItem(scene, {
      x: WIDTH / 2,
      y: HEIGHT - 115,
      keys: ["space"],
      base: 0,
      down: 1,
      downCallback: () => this.usePowerup(),
    })
      .setActive(false)
      .setFrame(1);
    this.powerupIcon = scene.add
      .image(WIDTH / 2, HEIGHT - 105, "items")
      .setOrigin(0.5, 0.5)
      .setDepth(DEPTH.UIFRONT + 1)
      .setScale(0.7, 0.7)
      .setVisible(false);

    this.add([
      this.leftButton,
      this.rightButton,
      this.upButton,
      this.downButton,
      this.powerupButton,
    ]);

    this.refreshPowerup();
    this.showEquipment();
    scene.add.existing(this);
  }

  refreshPowerup() {
    const state = store.getState();
    const powerup = state.player.powerup;
    if (powerup !== null) {
      this.powerupButton
        .setActive(true)
        .setFrame(this.powerupButton.frames.base);
      this.powerupIcon
        .setTexture(powerup.texture)
        .setFrame(powerup.frame)
        .setVisible(true);
    }
  }

  showEquipment() {
    const state = store.getState();
    let x = EQUIPMENT_LEFT;
    state.player.equipment
      .filter(({ accessory }) => !accessory)
      .forEach(({ texture, frame }) => {
        this.scene.add
          .image(x, EQUIPMENT_Y, texture, frame)
          .setDepth(DEPTH.UIFRONT)
          .setScale(0.4);
        x += EQUIPMENT_INTERVAL;
      });
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
