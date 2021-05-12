import Phaser from "phaser";
import { DEPTH } from "../globals";

function ButtonFactory(key, pixelPerfect = false, textStyle = {}) {
  class UIButton extends Phaser.GameObjects.Sprite {
    constructor(
      scene,
      {
        x,
        y,
        keys = [],
        originX = 0.5,
        originY = 0.5,
        base = 0,
        over = base,
        down = over,
        downCallback,
        upCallback,
        text = "",
        textOffset = { x: 0, y: 0 },
        overTextStyle = {},
        downTextStyle = overTextStyle,
      }
    ) {
      super(scene, x, y, key, base);

      this.frames = { base, over, down };

      this.hitbox = pixelPerfect
        ? this.scene.input.makePixelPerfect()
        : undefined;

      this.setActive(true);

      this.isDown = false;

      this.setDepth(DEPTH.UIFRONT)
        .setOrigin(originX, originY)
        .setInteractive(this.hitbox);

      this.text = scene.add
        .text(x + textOffset.x, y + textOffset.y, text, textStyle)
        .setDepth(DEPTH.UIFRONT + 1)
        .setOrigin(originX, originY);

      const overTextStyle_ = { ...textStyle, ...overTextStyle };
      const downTextStyle_ = { ...textStyle, ...downTextStyle };

      const handleDown = () => {
        if (!this.active) return;
        this.setFrame(down);
        this.text.setStyle(downTextStyle_);
        this.isDown = true;
        downCallback?.();
      };
      const handleUp = () => {
        if (!this.active) return;
        this.setFrame(over);
        this.text.setStyle(overTextStyle_);
        this.isDown = false;
        upCallback?.();
      };
      const handleOver = (pointer) => {
        if (!this.active) return;
        if (!this.isDown) {
          if (pointer.isDown) handleDown();
          else {
            this.setFrame(over);
            this.text.setStyle(overTextStyle_);
          }
        }
      };
      const handleOut = () => {
        if (!this.active) return;
        if (this.keys.some((key) => key.isDown)) return;
        if (this.isDown) handleUp();
        this.setFrame(base);
        this.text.setStyle(textStyle);
      };

      this.on("pointerover", handleOver);
      this.on("pointerout", handleOut);
      this.on("pointerdown", handleDown);
      this.on("pointerup", handleUp);

      this.keys = keys.map((keyName) => {
        const key = scene.input.keyboard.addKey(keyName, true, false);
        key.on("down", handleDown);
        key.on("up", handleOut);
        return key;
      });

      const handleBlur = () => {
        if (this.isDown) handleUp();
      };
      this.scene.events.on("pause", handleBlur);
      this.scene.game.events.on("blur", handleBlur);
      this.once("destroy", () =>
        this.scene.game.events.off("blur", handleBlur)
      );
    }

    show(value = true) {
      this.setVisible(value);
      this.text.setVisible(value);
      // Whether hiding or showing, we want the button to be default state.
      this.setFrame(this.frames.base);
      this.text.setStyle(textStyle);

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
