import Phaser from "phaser";
import store from "../store";
import Controls from "./controls";
import { WIDTH, PLAYERHEIGHT, DEPTH } from "../globals";
import { applyModifiersToState } from "../utils";

const HITBOX_UP_OFFSET = -45;
const HITBOX_DOWN_OFFSET = 30;
const HITBOX_HORIZ_OFFSET = -7;

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
    this.applyModifiersToPhysics();

    const { PLAYERDEPTH } = DEPTH;

    this.controls = new Controls(scene);

    this.skinName = "matsuri-" + this.state.skin;

    this.bodySprite = scene.physics.add
      .sprite(WIDTH / 2, PLAYERHEIGHT, this.skinName)
      .setSize(170, 230)
      .setOffset(25, 50)
      .setDepth(PLAYERDEPTH)
      .setMaxVelocity(this.modPhysics.maxVelocity)
      .setCollideWorldBounds(true)
      .setDragX(this.modPhysics.drag);

    this.bodySprite.body.setGravityY(this.modPhysics.gravity);

    this.armSprite = scene.physics.add
      .sprite(WIDTH / 2, PLAYERHEIGHT, this.skinName + "-arms-up")
      .setDepth(PLAYERDEPTH + 1);

    this.hitBox = scene.add.rectangle(
      WIDTH / 2 + HITBOX_HORIZ_OFFSET,
      PLAYERHEIGHT + HITBOX_UP_OFFSET,
      this.modPhysics.hitBoxWidth,
      this.modPhysics.hitBoxHeight
    );

    scene.physics.add.existing(this.hitBox);

    this.setDepth(PLAYERDEPTH);

    this.add([this.bodySprite, this.armSprite]);

    scene.add.existing(this);
  }

  applyModifiersToPhysics() {
    this.modPhysics = applyModifiersToState(this.state.physics);
  }

  applyPhysicsToSprites() {
    this.skinName = "matsuri-" + this.state.skin;
    this.bodySprite
      .setTexture(this.skinName)
      .setMaxVelocity(this.modPhysics.maxVelocity)
      .setDragX(this.modPhysics.drag);

    this.bodySprite.body.setGravityY(this.modPhysics.gravity);

    this.armSprite.setTexture(
      this.skinName + (this.crouching ? "-arms-down" : "-arms-up")
    );

    this.hitBox.setSize(
      this.modPhysics.hitBoxWidth,
      this.modPhysics.hitBoxHeight
    );
  }

  reloadState() {
    const newState = store.getState().player;
    if (this.state === newState) return;

    this.controls.refreshPowerup();

    const doPhysicsUpdate = this.state.physics !== newState.physics;
    this.state = newState;

    if (doPhysicsUpdate) {
      this.applyModifiersToPhysics();
      this.applyPhysicsToSprites();
    }
  }

  get jumping() {
    return !this.bodySprite.body.touching.down;
  }

  get crouching() {
    return this.controls.down;
  }

  update(time) {
    this.reloadState();
    if (this.controls.up) {
      if (this.bodySprite.body.touching.down) {
        this.bodySprite.setVelocityY(-this.modPhysics.jumpVelocity);
      }
      this.bodySprite.setAccelerationY(-this.modPhysics.jumpAcceleration);
    } else {
      this.bodySprite.setAccelerationY(0);
    }

    let armType;
    let armOffset;

    if (this.crouching) {
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
      this.bodySprite.setAccelerationX(-this.modPhysics.acceleration, 0);
    } else if (this.controls.right) {
      this.bodySprite.anims.play(this.skinName + ".run", true);
      this.armSprite.anims.play(this.skinName + armType + ".run", true);
      this.bodySprite.setAccelerationX(this.modPhysics.acceleration, 0);
    }

    syncSpritePhysics(this.bodySprite, this.armSprite);
    syncSpriteAnimations(this.bodySprite, this.armSprite);
    syncSpritePhysics(
      this.bodySprite,
      this.hitBox,
      HITBOX_HORIZ_OFFSET,
      armOffset
    );
  }
}
