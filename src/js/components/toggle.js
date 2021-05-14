import Phaser from "phaser";
import { DEPTH } from "../globals";
import store from "../store";
import { traverseState } from "../utils";

export default class Toggle extends Phaser.GameObjects.Group {
  constructor(
    scene,
    {
      texture,
      x,
      y,
      spacing,
      target,
      leftBase,
      leftSelected,
      rightBase,
      rightSelected,
      actionLeft,
      actionRight,
      leftState = true,
      toggleCallback,
    }
  ) {
    super(scene);
    const half = spacing / 2;
    const leftButton = scene.add
      .image(x - half, y, texture, leftBase)
      .setDepth(DEPTH.UIFRONT);
    const rightButton = scene.add
      .image(x + half, y, texture, rightBase)
      .setDepth(DEPTH.UIFRONT);

    this.add(leftButton);
    this.add(rightButton);

    this.rerender = () => {
      const state = store.getState();
      const currentState = traverseState(state, target);
      if (currentState === leftState) {
        leftButton.setFrame(leftSelected).disableInteractive();
        rightButton.setFrame(rightBase).setInteractive();
      } else {
        leftButton.setFrame(leftBase).setInteractive();
        rightButton.setFrame(rightSelected).disableInteractive();
      }
      this.state = currentState;
    };

    leftButton.on("pointerdown", () => {
      store.dispatch(actionLeft);
      this.rerender();
      toggleCallback?.(this.state);
    });
    rightButton.on("pointerdown", () => {
      store.dispatch(actionRight);
      this.rerender();
      toggleCallback?.(this.state);
    });

    this.rerender();
  }
}
