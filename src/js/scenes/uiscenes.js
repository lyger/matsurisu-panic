import Phaser from "phaser";
import { resetCatalog } from "../components/items/catalog";
import ButtonFactory from "../components/uibutton";
import { HEIGHT, WIDTH, TEXT_STYLE, DEPTH } from "../globals";
import store from "../store";
import { addCurtainsTransition } from "./curtains";
import RestartProxy from "./restartproxy";
import Stage from "./stage";

const Button = ButtonFactory("ui");

export class StartScreen extends Phaser.Scene {
  create() {
    const button = new Button(this, {
      x: WIDTH / 2,
      y: HEIGHT / 2,
      base: 0,
      hover: 1,
      down: 2,
      upCallback: () => this.startGame(),
    });

    this.add.existing(button);
  }

  startGame() {
    addCurtainsTransition({
      scene: this,
      targetKey: "Stage",
      targetClass: Stage,
      duration: 1000,
    });
  }
}

export class PauseScreen extends Phaser.Scene {
  create() {
    this.add
      .text(WIDTH / 2, HEIGHT / 2 - 100, "PAUSED", {
        ...TEXT_STYLE,
        fontSize: 50,
      })
      .setOrigin(0.5, 0.5)
      .setDepth(DEPTH.UIFRONT);

    this.button = new Button(this, {
      x: WIDTH / 2,
      y: HEIGHT / 2 + 50,
      base: 0,
      hover: 1,
      down: 2,
      upCallback: () => this.handleResume(),
    });

    this.add.existing(this.button);

    const escKey = this.input.keyboard.addKey("esc", true, false);
    escKey.on("down", () => this.handleResume());

    // this.debugRect = this.add
    //   .rectangle(WIDTH / 2, 800, 300, 80, 0x0000ff)
    //   .setDepth(DEPTH.UIFRONT)
    //   .setInteractive();
    // this.debugRect.on("pointerdown", () => this.handleNewGame());
  }

  handleResume() {
    this.scene.resume("Stage");
    this.scene.remove(this.scene.key);
  }

  handleNewGame() {
    const stageScene = this.scene.get("Stage");
    this.tweens.add({
      targets: stageScene.bgm,
      volume: 0.0,
      duration: 900,
      onComplete: () => stageScene.bgm.destroy(),
    });
    this.events.once("destroy", () => {
      stageScene.scene.remove("Stage");
    });
    store.dispatch({ type: "global.newGame" });
    addCurtainsTransition({
      scene: this,
      targetKey: "RestartProxy",
      targetClass: RestartProxy,
      duration: 1000,
    });
  }
}
