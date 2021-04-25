import Phaser from "phaser";

export default class DebugCursor {
  constructor(scene) {
    const coordText = scene.add
      .text(30, 30, "x: 0, y: 0")
      .setOrigin(0, 0)
      .setDepth(1000);
    scene.input.on("pointermove", ({ x, y }) => {
      coordText.setText(`x: ${x.toFixed(1)}, y: ${y.toFixed(1)}`);
    });
  }
}
