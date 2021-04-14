import Phaser from "phaser";
import store from "../store";
import Controls from "./controls";
import { WIDTH, PLAYERHEIGHT, DEPTH } from "../globals";

const HITBOX_UP_OFFSET = -70;
const HITBOX_DOWN_OFFSET = 20;

function syncSpritePhysics(from, to, xOffset = 0, yOffset = 0) {
  to.x = from.x + xOffset;
  to.y = from.y + yOffset;
  const velocity = from.body.velocity;
  const acceleration = from.body.acceleration;
  to.body.setVelocity(velocity.x, velocity.y);
  to.body.setAcceleration(acceleration.x, acceleration.y);
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
      .sprite(WIDTH / 2, PLAYERHEIGHT, this.skinName)
      .setSize(100, 150)
      .setOffset(25, 50)
      .setDepth(PLAYERDEPTH)
      .setMaxVelocity(this.state.physics.maxVelocity)
      .setCollideWorldBounds(true)
      .setDragX(this.state.physics.drag);

    this.bodySprite.body.setGravityY(this.state.physics.gravity);

    this.armSprite = scene.physics.add
      .sprite(WIDTH / 2, PLAYERHEIGHT, this.skinName + "-arms-up")
      .setDepth(PLAYERDEPTH + 1);

    this.hitBox = scene.add.rectangle(
      WIDTH / 2,
      PLAYERHEIGHT + HITBOX_UP_OFFSET,
      this.state.physics.hitBoxWidth,
      this.state.physics.hitBoxHeight
    );

    scene.physics.add.existing(this.hitBox);

    this.add([this.bodySprite, this.armSprite]);

    scene.add.existing(this);
  }

  update(time) {
    let armType;
    let armOffset;
    if (this.controls.up) {
      if (this.bodySprite.body.touching.down) {
        this.bodySprite.setVelocityY(-this.state.physics.jumpVelocity);
      }
      this.bodySprite.setAccelerationY(-this.state.physics.jumpAcceleration);
    } else {
      this.bodySprite.setAccelerationY(0);
    }
    if (this.controls.down) {
      armType = "-arms-down";
      armOffset = HITBOX_DOWN_OFFSET;
    } else {
      armType = "-arms-up";
      armOffset = HITBOX_UP_OFFSET;
    }
    if (this.controls.left == this.controls.right) {
      this.bodySprite.anims.play(this.skinName + ".idle", true);
      this.armSprite.anims.play(this.skinName + armType + ".idle", true);
      this.bodySprite.setAccelerationX(0);
    } else if (this.controls.left) {
      this.bodySprite.anims.play(this.skinName + ".run", true);
      this.armSprite.anims.play(this.skinName + armType + ".run", true);
      this.bodySprite.setAccelerationX(-this.state.physics.acceleration, 0);
    } else if (this.controls.right) {
      this.bodySprite.anims.play(this.skinName + ".run", true);
      this.armSprite.anims.play(this.skinName + armType + ".run", true);
      this.bodySprite.setAccelerationX(this.state.physics.acceleration, 0);
    }
    syncSpritePhysics(this.bodySprite, this.armSprite);
    syncSpriteAnimations(this.bodySprite, this.armSprite);
    syncSpritePhysics(this.bodySprite, this.hitBox, 0, armOffset);
  }
}
