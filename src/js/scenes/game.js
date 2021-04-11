import Phaser from "phaser";
import Player from "../components/player";
import sendTweet from "../twitter";

export default class Game extends Phaser.Scene {
  constructor() {
    super("Game");
  }

  create() {
    this.matsuri = new Player(this);

    // const debugKey = this.input.keyboard.addKey("space", true, false);
    // debugKey.on("down", () => {
    //   const imgData = this.screenshot.take(250, 500, 470, 780);
    //   sendTweet(
    //     "Test tweet with media",
    //     imgData,
    //     console.log,
    //     console.log
    //   );
    // });
  }

  update(time) {
    this.matsuri.update(time);
  }
}
