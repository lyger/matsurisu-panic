import Phaser from "phaser";
import store from "../store";
import Controls from "./controls";
import { WIDTH, PLAYERHEIGHT, DEPTH } from "../globals";
import { applyModifiersToState, syncSpritePhysics } from "../utils";

const HITBOX_UP_OFFSET = -27.5;
const HITBOX_DOWN_OFFSET = 82.5;
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

class PlayerBody extends Phaser.GameObjects.Container {
  constructor(scene, x, y, state, visibility) {
    super(scene, x, y);

    this.scene.physics.add.existing(this);

    this.updateState(state);
    this.bodySprite = new Phaser.GameObjects.Sprite(
      scene,
      0,
      0,
      this.skinName + "-idle"
    );
    this.equipment = this.state.equipment.map(
      ({ key, depth, animationName }) => {
        const equipmentTexture = "equipment-" + animationName;
        const equipmentSprite = new Phaser.GameObjects.Sprite(
          scene,
          0,
          0,
          equipmentTexture + "-idle"
        );
        return {
          key: /Equipment:([A-Za-z0-9]+)/.exec(key)[1].toLowerCase(),
          depth,
          texture: equipmentTexture,
          sprite: equipmentSprite,
        };
      }
    );
    const children = [{ depth: 0, sprite: this.bodySprite }].concat(
      this.equipment
    );
    children.sort((a, b) => a.depth - b.depth);
    children.forEach(({ sprite }) => {
      this.scene.add.existing(sprite);
      this.add(sprite);
    });
    this.updateVisibility(visibility);

    this.scene.add.existing(this);
  }

  updateState(state) {
    this.state = state;
    this.skinName = "matsuri-" + this.state.skin;
    return this;
  }

  updateVisibility(visibility) {
    this.equipment.forEach(({ key, sprite }) => {
      sprite.setVisible(visibility[key]);
    });
    return this;
  }

  playAnimation(animSuffix) {
    this.bodySprite.anims.play(this.skinName + animSuffix, true);
    this.equipment.forEach(({ texture, sprite }) =>
      sprite.anims.play(texture + animSuffix, true)
    );
    return this;
  }
}

export default class Player extends Phaser.GameObjects.Container {
  constructor(scene) {
    super(scene);

    this.state = store.getState().player;
    this.visibility = store.getState().settings.visibility;
    this.applyModifiersToPhysics();

    const { PLAYERDEPTH } = DEPTH;

    this.controls = new Controls(scene).setDepth(DEPTH.BGFRONT);
    this.airborne = false;
    this.sliding = false;
    this.canStartSlide = true;

    this.skinName = "matsuri-" + this.state.skin;
    this.facing = ".left";

    this.playerBody = new PlayerBody(
      scene,
      WIDTH / 2,
      PLAYERHEIGHT,
      this.state,
      this.visibility
    );
    this.playerBody.setDepth(PLAYERDEPTH);

    this.playerBody.body
      .setSize(100, 230)
      .setOffset(-52, -100)
      .setCollideWorldBounds(true)
      .setDragX(this.modPhysics.drag)
      .setMaxVelocityX(this.modPhysics.maxVelocity)
      .setGravityY(this.modPhysics.gravity);

    this.hitBox = scene.add.rectangle(
      WIDTH / 2 + HITBOX_HORIZ_OFFSET[this.facing],
      PLAYERHEIGHT + HITBOX_UP_OFFSET - this.modPhysics.hitBoxHeight / 2,
      this.modPhysics.hitBoxWidth,
      this.modPhysics.hitBoxHeight
    );

    scene.physics.add.existing(this.hitBox);

    this.setDepth(PLAYERDEPTH);

    this.add([this.playerBody]);

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

    this.playerBody.body
      .setDragX(this.modPhysics.drag)
      .setMaxVelocityX(this.modPhysics.maxVelocity)
      .setGravityY(this.modPhysics.gravity);

    this.hitBox.body.setSize(
      this.modPhysics.hitBoxWidth,
      this.modPhysics.hitBoxHeight
    );
  }

  reloadState() {
    const newState = store.getState().player;
    const newVisibility = store.getState().settings.visibility;
    if (this.visibility !== newVisibility) {
      this.playerBody.updateVisibility(newVisibility);
      this.visibility = newVisibility;
    }
    if (this.state === newState) return;

    this.playerBody.updateState(newState);

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
    this.playerBody.body.setVelocity(0).setAcceleration(0).setGravityY(0);
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
    const grounded = this.playerBody.body.touching.down;
    const quickFall = crouching && !grounded;
    const startedJump = jumping && grounded;
    const endedJump = this.airborne && grounded;

    this.airborne = !grounded;

    if (startedJump) {
      this.playerBody.body.setVelocityY(-this.modPhysics.jumpVelocity);
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
    this.playerBody.body.setAccelerationY(accelerationY);

    // Horizontal movement
    const sliding =
      crouching &&
      Math.abs(this.playerBody.body.velocity.x) >
        this.extraPhysics.crouchMaxVelocity &&
      (this.sliding ||
        Math.abs(this.playerBody.body.velocity.x) >
          this.extraPhysics.slideThresholdVelocity);
    const startedSliding =
      sliding && this.canStartSlide && sliding !== this.sliding;
    this.sliding = sliding;
    this.facing = idle ? this.facing : right ? ".right" : ".left";

    let armOffsetX;
    let armOffsetY;

    if (crouching) {
      armOffsetX = HITBOX_HORIZ_CROUCH_OFFSET[this.facing];
      armOffsetY = HITBOX_DOWN_OFFSET - this.modPhysics.crouchHitBoxHeight / 2;
      if (!sliding)
        this.playerBody.body.setMaxVelocityX(
          this.extraPhysics.crouchMaxVelocity
        );
      this.hitBox.body.setSize(
        this.modPhysics.crouchHitBoxWidth,
        this.modPhysics.crouchHitBoxHeight
      );
    } else {
      armOffsetX = HITBOX_HORIZ_OFFSET[this.facing];
      armOffsetY = HITBOX_UP_OFFSET - this.modPhysics.hitBoxHeight / 2;
      this.playerBody.body.setMaxVelocityX(this.modPhysics.maxVelocity);
      this.hitBox.body.setSize(
        this.modPhysics.hitBoxWidth,
        this.modPhysics.hitBoxHeight
      );
    }

    if (startedSliding) {
      this.playerBody.body.setMaxVelocityX(this.extraPhysics.slideMaxVelocity);
      this.playerBody.body.setVelocityX(
        this.playerBody.body.velocity.x * this.modPhysics.slideMultiplier
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
    this.playerBody.body.setAccelerationX(accelerationX);

    const animSuffix =
      (crouching ? "-down" : "") + (idle ? ".idle" : ".run") + this.facing;
    this.playerBody.playAnimation(animSuffix);

    if (idle) this.scene.events.emit("sound.idle");
    else
      this.scene.events.emit("sound.walk", {
        crouching,
        airborne: this.airborne,
      });

    syncSpritePhysics(this.playerBody, this.hitBox, armOffsetX, armOffsetY);
  }
}
