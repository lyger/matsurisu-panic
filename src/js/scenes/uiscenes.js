import Phaser from "phaser";
import { resetCatalog } from "../components/items/catalog";
import ButtonFactory from "../components/uibutton";
import { HEIGHT, WIDTH, TEXT_STYLE, DEPTH } from "../globals";
import store from "../store";
import Stage from "./stage";

const Button = ButtonFactory("ui");

export class StartScreen extends Phaser.Scene {
  create() {
    const button = new Button(this, {
      x: WIDTH / 2,
      y: HEIGHT / 2,
      default: 0,
      hover: 1,
      down: 2,
      upCallback: () => this.startGame(),
    });

    this.add.existing(button);
  }

  startGame() {
    this.scene.add("Stage", Stage, true);
    this.scene.remove(this.scene.key);
  }
}

export class GameOver extends Phaser.Scene {
  create() {
    this.add
      .text(WIDTH / 2, HEIGHT / 2 - 50, "GAME OVER", {
        ...TEXT_STYLE,
        fontSize: 100,
      })
      .setOrigin(0.5, 0.5)
      .setDepth(DEPTH.UIFRONT);

    this.button = new Button(this, {
      x: WIDTH / 2,
      y: HEIGHT / 2 + 50,
      default: 3,
      hover: 4,
      down: 5,
      upCallback: () => this.handleNewGame(),
    });

    this.add.existing(this.button);
  }

  handleNewGame() {
    this.scene.remove("Stage");
    store.dispatch({ type: "global.newGame" });
    resetCatalog();
    this.scene.add("Stage", Stage, true);
    this.scene.remove(this.scene.key);
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
      default: 0,
      hover: 1,
      down: 2,
      upCallback: () => this.handleResume(),
    });

    this.add.existing(this.button);
  }

  handleResume() {
    this.scene.resume("Stage");
    this.scene.remove(this.scene.key);
  }
}

export class WinScreen extends Phaser.Scene {
  create() {
    const scoreState = store.getState().score;
    this.add
      .image(WIDTH / 2, HEIGHT / 2 - 200, "win-placeholder")
      .setOrigin(0.5, 0.5)
      .setDepth(DEPTH.UIFRONT);

    this.add
      .text(WIDTH / 2, HEIGHT / 2, `SCORE: ${scoreState.score}`, TEXT_STYLE)
      .setOrigin(0.5, 0.5)
      .setDepth(DEPTH.UIFRONT);

    this.button = new Button(this, {
      x: WIDTH / 2,
      y: HEIGHT / 2 + 50,
      default: 3,
      hover: 4,
      down: 5,
      upCallback: () => this.handleNewGame(),
    });

    this.add.existing(this.button);
  }

  handleNewGame() {
    this.scene.remove("Stage");
    store.dispatch({ type: "global.newGame" });
    resetCatalog();
    this.scene.add("Stage", Stage, true);
    this.scene.remove(this.scene.key);
  }
}
