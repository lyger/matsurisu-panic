import Phaser from "phaser";
import store from "../store";
import Controls from "./controls";
import { WIDTH, PLAYERHEIGHT, DEPTH } from "../globals";
import { applyModifiersToState } from "../utils";

const HITBOX_UP_OFFSET = -45;
const HITBOX_DOWN_OFFSET = 60;
const HITBOX_HORIZ_OFFSET = {
  ".left": -7,
  ".right": -7,
};
const HITBOX_HORIZ_CROUCH_OFFSET = {
  ".left": -7,
  ".right": 7,
};

function syncSpritePhysics(from, to, xOffset = 0, yOffset = 0) {
  to.x = from.x + xOffset;
  to.y = from.y + yOffset;
  const velocity = from.body.velocity;
  const acceleration = from.body.acceleration;
  to.body.setVelocity(velocity.x, velocity.y);
  to.body.setAcceleration(acceleration.x, acceleration.y);
}

// function syncSpriteAnimations(from, to) {
//   to.anims.setProgress(from.anims.getProgress());
// }

export default class Player extends Phaser.GameObjects.Container {
  constructor(scene) {
    super(scene);

    this.state = store.getState().player;
    this.applyModifiersToPhysics();

    const { PLAYERDEPTH } = DEPTH;

    this.controls = new Controls(scene);
    this.airborne = false;
    this.sliding = false;
    this.canStartSlide = true;

    this.skinName = "matsuri-" + this.state.skin;
    this.facing = ".right";

    this.bodySprite = scene.physics.add
      .sprite(WIDTH / 2, PLAYERHEIGHT, this.skinName)
      .setSize(100, 230)
      .setOffset(60, 50)
      .setDepth(PLAYERDEPTH)
      .setCollideWorldBounds(true)
      .setDragX(this.modPhysics.drag);

    this.bodySprite.body
      .setMaxVelocityX(this.modPhysics.maxVelocity)
      .setGravityY(this.modPhysics.gravity);

    this.hitBox = scene.add.rectangle(
      WIDTH / 2 + HITBOX_HORIZ_OFFSET[this.facing],
      PLAYERHEIGHT + HITBOX_UP_OFFSET,
      this.modPhysics.hitBoxWidth,
      this.modPhysics.hitBoxHeight
    );

    scene.physics.add.existing(this.hitBox);

    this.setDepth(PLAYERDEPTH);

    this.add([this.bodySprite]);

    scene.add.existing(this);
  }

  applyModifiersToPhysics() {
    this.modPhysics = applyModifiersToState(this.state.physics);
    this.computeExtraPhysics();
  }

  computeExtraPhysics() {
    this.extraPhysics = {
      crouchMaxVelocity:
        this.modPhysics.maxVelocity * this.modPhysics.crouchMultiplier,
      slideMaxVelocity:
        this.modPhysics.maxVelocity * this.modPhysics.slideMultiplier,
      slideThresholdVelocity:
        this.modPhysics.maxVelocity * this.modPhysics.slideThreshold,
    };
  }

  applyPhysicsToSprites() {
    this.skinName = "matsuri-" + this.state.skin;
    this.bodySprite.setTexture(this.skinName).setDragX(this.modPhysics.drag);

    this.bodySprite.body
      .setMaxVelocityX(this.modPhysics.maxVelocity)
      .setGravityY(this.modPhysics.gravity);

    this.hitBox.body.setSize(
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

  disable() {
    this.setActive(false);
    this.bodySprite.setVelocity(0).setAcceleration(0).setGravityY(0);
    this.controls.disable();
  }

  enable() {
    this.setActive(true);
    this.controls.enable();
  }

  update(time) {
    if (!this.active) return;
    this.reloadState();

    // Vertical movement
    const grounded = this.bodySprite.body.touching.down;
    const jump = this.controls.up;
    const startedJump = jump && grounded;
    const endedJump = this.airborne && grounded;

    this.airborne = !grounded;

    if (startedJump)
      this.bodySprite.setVelocityY(-this.modPhysics.jumpVelocity);
    if (endedJump) store.dispatch({ type: "score.resetAirCounter" });

    const accelerationY = jump ? -this.modPhysics.jumpAcceleration : 0;
    this.bodySprite.setAccelerationY(accelerationY);

    // Horizontal movement
    const idle = this.controls.left === this.controls.right;
    const right = !idle && this.controls.right;
    const crouching = this.crouching;
    const sliding =
      crouching &&
      Math.abs(this.bodySprite.body.velocity.x) >
        this.extraPhysics.crouchMaxVelocity &&
      (this.sliding ||
        Math.abs(this.bodySprite.body.velocity.x) >
          this.extraPhysics.slideThresholdVelocity);
    const startedSliding =
      sliding && this.canStartSlide && sliding !== this.sliding;
    this.sliding = sliding;
    this.facing = idle ? this.facing : right ? ".right" : ".left";

    let armOffsetX;
    let armOffsetY;

    if (crouching) {
      armOffsetX = HITBOX_HORIZ_CROUCH_OFFSET[this.facing];
      armOffsetY = HITBOX_DOWN_OFFSET;
      if (!sliding)
        this.bodySprite.body.setMaxVelocityX(
          this.extraPhysics.crouchMaxVelocity
        );
      this.hitBox.body.setSize(
        this.modPhysics.crouchHitBoxWidth,
        this.modPhysics.crouchHitBoxHeight
      );
    } else {
      armOffsetX = HITBOX_HORIZ_OFFSET[this.facing];
      armOffsetY = HITBOX_UP_OFFSET;
      this.bodySprite.body.setMaxVelocityX(this.modPhysics.maxVelocity);
      this.hitBox.body.setSize(
        this.modPhysics.hitBoxWidth,
        this.modPhysics.hitBoxHeight
      );
    }

    if (startedSliding) {
      this.bodySprite.body.setMaxVelocityX(this.extraPhysics.slideMaxVelocity);
      this.bodySprite.body.setVelocityX(
        this.bodySprite.body.velocity.x * this.modPhysics.slideMultiplier
      );
      this.canStartSlide = false;
      this.scene.time.delayedCall(
        this.modPhysics.slideCooldown,
        () => (this.canStartSlide = true)
      );
    }

    const accelerationX =
      idle || sliding
        ? 0
        : right
        ? this.modPhysics.acceleration
        : -this.modPhysics.acceleration;
    this.bodySprite.setAccelerationX(accelerationX);

    const animName =
      this.skinName +
      (crouching ? "-down" : "") +
      (idle ? ".idle" : ".run") +
      this.facing;
    this.bodySprite.anims.play(animName, true);

    syncSpritePhysics(this.bodySprite, this.hitBox, armOffsetX, armOffsetY);
  }
}
