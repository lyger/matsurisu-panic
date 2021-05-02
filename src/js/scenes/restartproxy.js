import Phaser from "phaser";
import Stage from "./stage";

// Exists to allow starting a new game from the pause menu, to facilitate removing and re-adding the Stage scene.
export default class RestartProxy extends Phaser.Scene {
  create() {
    this.scene.add("Stage", Stage, false);
    this.scene.moveBelow(this.scene.key, "Stage");
    this.scene.run("Stage");
    this.events.once("transitioncomplete", () => {
      this.scene.remove(this.scene.key);
    });
  }
}
