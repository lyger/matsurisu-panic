import Phaser from "phaser";

export default class ScreenshotPlugin extends Phaser.Plugins.BasePlugin {
  take(left, top, right, bottom) {
    if (right < left) {
      [left, right] = [right, left];
    }
    if (bottom < top) {
      [top, bottom] = [bottom, top];
    }

    const tempCanvas = document.createElement("canvas");
    const width = right - left;
    const height = bottom - top;
    tempCanvas.width = width;
    tempCanvas.height = height;
    const tempCtx = tempCanvas.getContext("2d");

    tempCtx.drawImage(
      this.game.canvas,
      left,
      top,
      width,
      height,
      0,
      0,
      width,
      height
    );
    return /base64,(.+)/.exec(tempCanvas.toDataURL("image/png"))[1];
  }
}
