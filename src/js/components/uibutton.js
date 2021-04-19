import Phaser from "phaser";
import { DEPTH } from "../globals";

const defaultConfig = {
  x: 0,
  y: 0,
  keys: [],
  originX: 0.5,
  originY: 0.5,
  default: 0,
  over: null,
  down: null,
  downCallback: null,
  upCallback: null,
};

function ButtonFactory(key, pixelPerfect = false) {
  class UIButton extends Phaser.GameObjects.Sprite {
    constructor(scene, config) {
      const updatedConfig = { ...defaultConfig, ...config };

      const {
        x,
        y,
        keys,
        originX,
        originY,
        downCallback,
        upCallback,
      } = updatedConfig;

      if (updatedConfig.over === null)
        updatedConfig.over = updatedConfig.default;
      if (updatedConfig.down === null) updatedConfig.down = updatedConfig.over;

      super(scene, x, y, key, updatedConfig.default);

      this.hitbox = pixelPerfect
        ? this.scene.input.makePixelPerfect()
        : undefined;

      this.setActive(true);

      this.config = updatedConfig;

      this.isDown = false;

      this.setDepth(DEPTH.UIFRONT)
        .setOrigin(originX, originY)
        .setInteractive(this.hitbox);

      const handleDown = () => {
        if (!this.active) return;
        this.setFrame(this.config.down);
        this.isDown = true;
        if (downCallback !== null) downCallback();
      };
      const handleUp = () => {
        if (!this.active) return;
        this.setFrame(this.config.over);
        this.isDown = false;
        if (upCallback !== null) upCallback();
      };
      const handleOver = () => {
        if (!this.active) return;
        this.setFrame(this.config.over);
      };
      const handleOut = () => {
        if (!this.active) return;
        if (this.isDown) handleUp();
        this.setFrame(this.config.default);
      };

      this.on("pointerover", handleOver);
      this.on("pointerout", handleOut);
      this.on("pointerdown", handleDown);
      this.on("pointerup", handleUp);

      this.keys = {};

      keys.forEach((keyName) => {
        const key = scene.input.keyboard.addKey(keyName, true, false);
        key.on("down", handleDown);
        key.on("up", handleOut);
        this.keys[keyName] = key;
      });
    }

    show(value = true) {
      this.setVisible(value);
      // Whether hiding or showing, we want the button to be default state.
      this.setFrame(this.config.default);

      if (value) {
        this.setInteractive(this.hitbox);
      } else {
        this.removeInteractive();
      }

      return this;
    }
  }

  return UIButton;
}

export default ButtonFactory;
