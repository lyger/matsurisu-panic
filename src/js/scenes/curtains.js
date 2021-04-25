import Phaser from "phaser";
import { CURTAIN_COLOR_1, CURTAIN_COLOR_2, HEIGHT, WIDTH } from "../globals";

export default class Curtains extends Phaser.Scene {
  create({ target, duration }) {
    const num = 8;
    const center = WIDTH / 2;
    const width = WIDTH / (2 * num) + 1;
    const half = width / 2;
    const left = -half;
    const right = WIDTH + half;
    const height = 1.1 * HEIGHT;
    const y = -0.05 * HEIGHT;
    const theta = (2 * Math.PI) / (3 * num);

    this.tweenConfigs = [];

    for (let i = 0; i < num; i++) {
      const odd = i % 2 === 1;
      const color1 = odd ? CURTAIN_COLOR_1 : CURTAIN_COLOR_2;
      const color2 = odd ? CURTAIN_COLOR_2 : CURTAIN_COLOR_1;

      const x1 = center - i * width - half;
      const x2 = center + i * width + half;

      const stripe1 = this.add
        .rectangle(left, y, width, height, color1)
        .setOrigin(0.5, 0)
        .setRotation((num - i) * theta);

      const stripe2 = this.add
        .rectangle(right, y, width, height, color2)
        .setOrigin(0.5, 0)
        .setRotation((i - num) * theta);

      this.tweenConfigs.push({
        targets: stripe1,
        ease: "Quad",
        x: x1,
        rotation: 0,
        repeat: 0,
        yoyo: true,
      });

      this.tweenConfigs.push({
        targets: stripe2,
        ease: "Quad",
        x: x2,
        rotation: 0,
        repeat: 0,
        yoyo: true,
      });
    }

    this.events.on("wake", (_, data) => this.doTransition(data));

    this.doTransition({ target, duration });
  }

  doTransition(data) {
    const { target, duration } = data;
    this.tweenConfigs.forEach((config) =>
      this.tweens.add({
        ...config,
        duration: duration * 0.8,
        hold: duration * 0.4,
      })
    );

    this.scene.bringToTop(this.scene.key);

    this.time.delayedCall(duration * 1.1, () => {
      this.scene.transition({
        target,
        duration: duration * 0.9,
        sleep: true,
        remove: false,
        allowInput: false,
      });
    });
  }
}

export function addCurtainsTransition({
  scene,
  targetKey,
  targetClass,
  duration,
}) {
  scene.scene.add(targetKey, targetClass, false);
  scene.scene.transition({
    target: "Curtains",
    duration: duration,
    sleep: false,
    remove: true,
    allowInput: false,
    data: {
      target: targetKey,
      duration: duration,
    },
  });
}
