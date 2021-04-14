import Phaser from "phaser";
import { TEXT_STYLE } from "../globals";
import store from "../store";

export default class Scoreboard extends Phaser.GameObjects.Container {
  constructor(scene) {
    super(scene);

    this.refreshState();

    this.scoreText = this.scene.add.text(30, 30, "SCORE: 0", TEXT_STYLE);
    this.moneyText = this.scene.add.text(30, 70, "MONEY: 0", TEXT_STYLE);
    this.livesText = this.scene.add.text(30, 110, "LIVES: 3", TEXT_STYLE);

    scene.events.on("matsurisu.catch", (coords) => {
      console.log("Matsurisu caught at", coords);
      store.dispatch({ type: "score.addScore", payload: 5 });
      this.refreshState();
    });

    scene.events.on("money.catch", (coords) => {
      console.log("Money caught at", coords);
      store.dispatch({ type: "score.gainMoney" });
      this.refreshState();
    });

    scene.events.on("matsurisu.drop", (coords) => {
      console.log("Matsurisu dropped at", coords);
      store.dispatch({ type: "score.loseLife" });
      this.refreshState();
      if (this.state.lives == 0) return scene.events.emit("global.gameOver");
    });
  }

  refreshState() {
    this.state = store.getState().score;
  }

  update(time) {
    this.scoreText.setText(`SCORE: ${this.state.score}`);
    this.moneyText.setText(`MONEY: ${this.state.money}`);
    this.livesText.setText(`LIVES: ${this.state.lives}`);
  }
}
