import Phaser from "phaser";
import store from "../store";
import { addCurtainsTransition } from "./curtains";

export default class BaseScene extends Phaser.Scene {
  playSoundEffect(key, adjustment = 1.0) {
    const volume = store.getState().settings.volumeSfx;
    this.sound.play(key, { volume: volume * adjustment });
  }

  curtainsTo(targetKey, targetClass, duration = 1000) {
    addCurtainsTransition({
      scene: this,
      targetKey,
      targetClass,
      duration,
    });
  }
}
