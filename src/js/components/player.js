import Phaser from "phaser";
import store from "../store";
import Controls from "./controls";
import { WIDTH, PLAYERHEIGHT, DEPTH } from "../globals";
import { applyModifiersToState, syncSpritePhysics } from "../utils";

const HITBOX_UP_OFFSET = -45;
const HITBOX_DOWN_OFFSET = 60;
const HITBOX_HORIZ_OFFSET = {
  ".left": -9,
  ".right": 5,
};
const HITBOX_HORIZ_CROUCH_OFFSET = {
  ".left": -7,
  ".right": 7,
};

// function syncSpriteAnimations(from, to) {
//   to.anims.setProgress(from.anims.getProgress());
// }

export default class Player extends Phaser.GameObjects.Container {
  constructor(scene) {
    super(scene);

    this.state = store.getState().player;
    this.applyModifiersToPhysics();

    const { PLAYERDEPTH } = DEPTH;

    this.controls = new Controls(scene).setDepth(DEPTH.BGFRONT);
    this.airborne = false;
    this.sliding = false;
    this.canStartSlide = true;

    this.skinName = "matsuri-" + this.state.skin;
    this.facing = ".left";

    this.bodySprite = scene.physics.add
      .sprite(WIDTH / 2, PLAYERHEIGHT, this.skinName + "-idle")
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
    this.bodySprite.setDragX(this.modPhysics.drag);

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

  disable() {
    this.setActive(false);
    this.hitBox.body.setVelocity(0).setAcceleration(0);
    this.hitBox.setActive(false);
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

    // Inputs
    const idle = this.controls.left === this.controls.right;
    const right = !idle && this.controls.right;
    const crouching = this.controls.down;
    const jumping = this.controls.up;

    // Vertical movement
    const grounded = this.bodySprite.body.touching.down;
    const quickFall = crouching && !grounded;
    const startedJump = jumping && grounded;
    const endedJump = this.airborne && grounded;

    this.airborne = !grounded;

    if (startedJump) {
      this.bodySprite.setVelocityY(-this.modPhysics.jumpVelocity);
      this.scene.events.emit("sound.jump");
      this.emit("jump");
    }
    if (endedJump) {
      this.emit("land");
      store.dispatch({ type: "score.resetAir" });
    }

    const accelerationY = jumping
      ? -this.modPhysics.jumpAcceleration
      : quickFall
      ? this.modPhysics.quickFallAcceleration
      : 0;
    this.bodySprite.setAccelerationY(accelerationY);

    // Horizontal movement
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
      if (grounded) this.scene.events.emit("sound.slide");
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

    if (idle) this.scene.events.emit("sound.idle");
    else
      this.scene.events.emit("sound.walk", {
        crouching,
        airborne: this.airborne,
      });

    syncSpritePhysics(this.bodySprite, this.hitBox, armOffsetX, armOffsetY);
  }
}
