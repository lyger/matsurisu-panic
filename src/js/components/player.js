import Phaser from "phaser";
import store from "../store";
import Controls from "./controls";
import { HEIGHT, WIDTH, DEPTH } from "../globals";

function syncSpritePhysics(from, to, xOffset = 0, yOffset = 0) {
  to.x = from.x + xOffset;
  to.y = from.y + yOffset;
  const velocity = from.body.velocity;
  const acceleration = from.body.acceleration;
  to.setVelocity(velocity.x, velocity.y);
  to.setAcceleration(acceleration.x, acceleration.y);
}

function syncSpriteAnimations(from, to) {
  to.anims.setProgress(from.anims.getProgress());
}

export default class Player extends Phaser.GameObjects.Container {
  constructor(scene) {
    super(scene);

    this.state = store.getState().player;
    const { PLAYERDEPTH } = DEPTH;

    this.controls = new Controls(scene);

    this.skinName = "matsuri-" + this.state.skin;

    this.bodySprite = scene.physics.add
      .sprite(WIDTH / 2, HEIGHT / 2, this.skinName)
      .setDepth(PLAYERDEPTH)
      .setMaxVelocity(this.state.physics.maxVelocity)
      .setCollideWorldBounds(true)
      .setDragX(this.state.physics.drag);

    this.armSprite = scene.physics.add
      .sprite(WIDTH / 2, HEIGHT / 2, this.skinName + "-arms-up")
      .setDepth(PLAYERDEPTH + 1);

    this.debugText = scene.add.text(0, 0, "DEBUG");

    this.add([this.bodySprite]);

    scene.add.existing(this);
  }

  update(time) {
    this.debugText.setText(
      `Player x: ${this.bodySprite.x}\nPlayer y: ${this.bodySprite.y}`
    );
    const armType = this.controls.down ? "-arms-down" : "-arms-up";
    if (this.controls.left == this.controls.right) {
      this.bodySprite.anims.play(this.skinName + ".idle", true);
      this.armSprite.anims.play(this.skinName + armType + ".idle", true);
      this.bodySprite.setAcceleration(0);
    } else if (this.controls.left) {
      this.bodySprite.anims.play(this.skinName + ".run", true);
      this.armSprite.anims.play(this.skinName + armType + ".run", true);
      this.bodySprite.setAcceleration(-this.state.physics.acceleration, 0);
    } else if (this.controls.right) {
      this.bodySprite.anims.play(this.skinName + ".run", true);
      this.armSprite.anims.play(this.skinName + armType + ".run", true);
      this.bodySprite.setAcceleration(this.state.physics.acceleration, 0);
    }
    syncSpritePhysics(this.bodySprite, this.armSprite);
    syncSpriteAnimations(this.bodySprite, this.armSprite);
  }
}
