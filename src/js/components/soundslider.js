import Phaser from "phaser";
import { DEPTH } from "../globals";
import store from "../store";
import { traverseState } from "../utils";

const SLIDER_WIDTH = 260;

export default class SoundSlider extends Phaser.GameObjects.Container {
  constructor(scene, { x, y, target, changeAction, changeCallback }) {
    super(scene, x, y);
    this.target = target;
    this.left = -SLIDER_WIDTH / 2;
    this.frame = new Phaser.GameObjects.Image(scene, 0, 0, "sound-slider-frame")
      .setDepth(DEPTH.UIBACK)
      .setInteractive(this.scene.input.makePixelPerfect());
    this.frameLeft = (this.frame.width - SLIDER_WIDTH) / 2;
    this.frame.on("pointerdown", (pointer, downX) => {
      const newValue =
        Phaser.Math.Clamp(downX - this.frameLeft, 0, SLIDER_WIDTH) /
        SLIDER_WIDTH;
      store.dispatch({ ...changeAction, payload: newValue });
      changeCallback?.(newValue);
      this.refreshState();
      this.playSampleSound();
    });
    this.gauge = new Phaser.GameObjects.Sprite(
      scene,
      0,
      -1,
      "sound-slider-gauge"
    ).setDepth(DEPTH.UIBACK + 1);
    this.knob = new Phaser.GameObjects.Sprite(scene, 0, -1, "sound-slider-knob")
      .setDepth(DEPTH.UIFRONT)
      .setInteractive(this.scene.input.makePixelPerfect());
    this.scene.input.setDraggable(this.knob);
    this.knob.on("drag", (pointer, dragX) => {
      const newValue =
        Phaser.Math.Clamp(dragX - this.left, 0, SLIDER_WIDTH) / SLIDER_WIDTH;
      store.dispatch({ ...changeAction, payload: newValue });
      changeCallback?.(newValue);
      this.refreshState();
    });
    this.knob.on("dragend", this.playSampleSound, this);

    this.add([this.frame, this.gauge, this.knob]);
    this.scene.add.existing(this);

    this.refreshState();
  }

  setMute(value = true) {
    this.scene.input.setDraggable(this.knob, !value);
    if (value) {
      this.gauge.setCrop(0, 0, 0, 10);
      this.frame.disableInteractive();
      this.knob.x = this.left;
    } else {
      this.frame.setInteractive(this.scene.input.makePixelPerfect());
      this.refreshState();
    }
  }

  playSampleSound() {
    this.scene.sound.play("menu-no", { volume: 0.5 * this.value });
  }

  refreshState() {
    this.value = traverseState(store.getState(), this.target);
    const displayWidth = SLIDER_WIDTH * this.value;
    this.gauge.setCrop(0, 0, displayWidth, 10);
    this.knob.x = this.left + displayWidth;
  }
}
