import Phaser from "phaser";
import ButtonFactory from "./uibutton";
import { WIDTH, HEIGHT } from "../globals";

const ControlButton = ButtonFactory("controls");

const BOTTOM_MARGIN = 200;
const SIDE_MARGIN = 100;

export default class Controls extends Phaser.GameObjects.Container {
  constructor(scene) {
    super(scene);

    this._left = false;
    this._right = false;
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
    this.downButton = new ControlButton(scene, {
      x: WIDTH / 2,
      y: HEIGHT - BOTTOM_MARGIN,
      keys: ["s", "down"],
      default: 6,
      down: 7,
      downCallback: () => (this._down = true),
      upCallback: () => (this._down = false),
    });

    this.add([this.leftButton, this.rightButton, this.downButton]);

    scene.add.existing(this);
  }

  get left() {
    return this._left;
  }

  get right() {
    return this._right;
  }

  get down() {
    return this._down;
  }
}
