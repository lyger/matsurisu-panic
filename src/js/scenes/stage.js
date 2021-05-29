import Phaser from "phaser";
import {
  DEPTH,
  GROUNDHEIGHT,
  HEIGHT,
  STAGE_BGM_VOLUME_FACTOR,
  WIDTH,
} from "../globals";
import Player from "../components/player";
import Dropper from "../components/dropper";
import Scoreboard from "../components/scoreboard";
import ButtonFactory from "../components/uibutton";
import PauseScreen from "./pause";
import store from "../store";
import Shop from "./shop";
import Results from "./results";
import { combinePowerups } from "../components/items/catalog";
import BaseScene from "./base";
import { InstructionsModal } from "./modal";

const GAME_START_DELAY = 1000;
const GAME_END_DELAY = 1000;
const EFFECT_FADE_DURATION = 5000;
const EFFECT_BLINK_DURATION = 500;

const PauseButton = ButtonFactory("pause-button", true);

export default class Stage extends BaseScene {
  create() {
    store.dispatch({ type: "stage.increaseLevel" });

    this.maybeShowInstructions();

    this.activateEquipment();

    this.createSounds();
    this.createSoundListeners();
    this.bgm.play({ delay: GAME_START_DELAY / 2000 });

    this.background = this.add
      .image(WIDTH / 2, HEIGHT / 2, "stage-background")
      .setDepth(DEPTH.BGBACK);
    this.matsuri = new Player(this);
    this.dropper = new Dropper(this);
    this.scoreboard = new Scoreboard(this, 45);
    this.effects = [];

    this.createPlayerCollisions();
    this.createGroundCollisions();

    this.createUIButtons();
    this.createEvents();

    if (this.anims.paused) this.anims.resumeAll();

    const debugKey = this.input.keyboard.addKey("z", true, false);
    debugKey.on("down", () => {
      this.winStage();
    });
    const debugKey2 = this.input.keyboard.addKey("x", true, false);
    debugKey2.on("down", () => {
      this.loseStage();
    });
    // const debugKey3 = this.input.keyboard.addKey("c", true, false);
    // debugKey3.on("down", () => {
    //   this.events.emit("global.feverStart");
    // });
  }

  createUIButtons() {
    this.pauseButton = new PauseButton(this, {
      x: 45,
      y: 45,
      keys: ["esc"],
      base: 0,
      over: 1,
      down: 1,
      downCallback: () => this.pauseGame(),
    }).setActive(false);

    const mute = store.getState().settings.mute;
    this.game.sound.mute = mute;
    this.muteButton = this.add
      .sprite(675, 45, "mute-button", mute ? 1 : 0)
      .setDepth(DEPTH.UIFRONT)
      .setInteractive(this.input.makePixelPerfect());
    this.muteButton.on("pointerdown", this.toggleMute, this);
    const muteKey = this.input.keyboard.addKey("m", true, false);
    muteKey.on("down", this.toggleMute, this);
  }

  createPlayerCollisions() {
    this.physics.add.overlap(
      this.matsuri.hitBox,
      this.dropper.matsurisu,
      (player, matsurisu) => {
        const state = store.getState();
        const isLow =
          matsurisu.body.center.y >= state.stage.matsurisu.lowCatchY;
        const airborne = this.matsuri.airborne;
        const data = {
          x: matsurisu.x,
          y: matsurisu.y,
          isFever: matsurisu.getData("fever"),
          isLow,
          airborne,
          risuType: matsurisu.getData("risuType"),
        };
        matsurisu.destroy();
        this.events.emit("matsurisu.catch", data);
        this.setAirForgiveness();
      }
    );

    this.physics.add.overlap(
      this.matsuri.hitBox,
      this.dropper.money,
      (player, money) => {
        const airborne = this.matsuri.airborne;
        const data = {
          x: money.x,
          y: money.y,
          isFever: money.getData("fever"),
          isLucky: money.getData("lucky"),
          airborne,
        };
        money.destroy();
        this.events.emit("coin.catch", data);
        this.setAirForgiveness();
      }
    );

    this.physics.add.overlap(
      this.matsuri.hitBox,
      this.dropper.powerup,
      (player, powerup) => {
        const target = powerup.getData("target");
        const price = powerup.getData("price");
        const state = store.getState();
        if (price > 0 && price > state.score.money) return;
        const currentPowerup = state.player.powerup;
        const airborne = this.matsuri.airborne;
        const data = {
          x: powerup.x,
          y: powerup.y,
          isFever: powerup.getData("fever"),
          isRedundant: false,
          upgraded: null,
          target,
          airborne,
          price,
        };
        if (currentPowerup === null) {
          store.dispatch({
            type: "player.setPowerup",
            payload: target,
          });
        } else {
          const combinedPowerup = combinePowerups(currentPowerup, target);
          if (combinedPowerup === null) {
            data.isRedundant = true;
          } else {
            store.dispatch({
              type: "player.setPowerup",
              payload: combinedPowerup,
            });
            data.upgraded = combinedPowerup;
          }
        }
        powerup.destroy();
        this.events.emit("powerup.catch", data);
        this.setAirForgiveness();
      }
    );

    this.createPlayerEbifrionCollision();
  }

  createPlayerEbifrionCollision() {
    this.physics.add.overlap(
      this.matsuri.hitBox,
      this.dropper.ebifrion,
      (player, ebifrion) => {
        const state = store.getState();
        const airborne = this.matsuri.airborne;
        const data = {
          x: ebifrion.x,
          y: ebifrion.y,
          rotation: ebifrion.rotation,
          state,
          airborne,
        };
        ebifrion.destroy();
        this.events.emit("ebifrion.catch", data);
        this.setAirForgiveness();
      }
    );
  }

  createGroundCollisions() {
    this.ground = this.add
      .rectangle(WIDTH / 2, GROUNDHEIGHT, 720, 300)
      .setOrigin(0.5, 0);
    this.physics.add.existing(this.ground, true);

    this.physics.add.collider(
      this.ground,
      this.dropper.matsurisu,
      (ground, matsurisu) => {
        const invincible = store.getState().score.invincible;
        const bonus = matsurisu.getData("bonus");
        const data = {
          x: matsurisu.x,
          y: matsurisu.y,
          rotation: matsurisu.rotation,
          flip: matsurisu.flipX,
          bonus,
          invincible,
          risuType: matsurisu.getData("risuType"),
        };
        matsurisu.destroy();
        this.events.emit("matsurisu.drop", data);
        if (!invincible && !bonus) this.playSoundEffect("matsurisu-drop", 0.75);
      }
    );

    this.physics.add.collider(
      this.ground,
      this.dropper.money,
      (ground, money) => {
        const data = {
          x: money.x,
          y: money.y,
          isLucky: money.getData("lucky"),
        };
        money.destroy();
        this.events.emit("coin.drop", data);
        this.playSoundEffect("coin-drop");
      }
    );

    this.physics.add.collider(
      this.ground,
      this.dropper.powerup,
      (ground, powerup) => {
        const data = {
          x: powerup.x,
          y: powerup.y,
          target: powerup.getData("target"),
        };
        powerup.destroy();
        this.events.emit("powerup.drop", data);
        this.playSoundEffect("powerup-drop");
      }
    );

    this.createGroundEbifrionCollision();

    this.physics.add.collider(this.ground, this.matsuri.playerBody);
    this.physics.add.collider(this.ground, this.matsuri.armSprite);
  }

  createGroundEbifrionCollision() {
    this.physics.add.collider(
      this.ground,
      this.dropper.ebifrion,
      (ground, ebifrion) => {
        const data = {
          x: ebifrion.x,
          y: ebifrion.y,
          rotation: ebifrion.rotation,
        };
        ebifrion.destroy();
        this.events.emit("ebifrion.drop", data);
        this.playSoundEffect("ebifrion-drop");
      }
    );
  }

  createEvents() {
    const state = store.getState();
    this.events.once("global.gameOver", this.loseStage, this);
    this.events.on("global.feverStart", this.activateFever, this);

    this.game.events.on("blur", this.pauseGame, this);
    this.events.once("destroy", () => {
      this.game.events.off("blur", this.pauseGame, this);
    });
    this.events.on("resume", this.resumeGame, this);

    this.events.on("stage.addEffect", this.addEffect, this);

    if (state.stage.isEndless) {
      this.events.on("dropper.done", () => {
        store.dispatch({ type: "global.winStageEndless" });
        store.dispatch({ type: "stage.increaseLevel" });
        this.events.emit("rerender");
        this.events.emit("dropper.reset");
        this.createPlayerEbifrionCollision();
        this.createGroundEbifrionCollision();
      });
      this.events.on("global.feverEnd", () => {
        this.dropper.setupFever();
      });
    } else {
      this.events.once("dropper.done", () => {
        this.fadeBgm(GAME_END_DELAY);
        this.time.delayedCall(GAME_END_DELAY, () => {
          const state = store.getState();
          if (state.score.drops === 0) {
            this.sound.play("stage-full-combo");
            this.events.emit("global.fullCombo");
            this.time.delayedCall(GAME_END_DELAY, () => this.winStage());
          } else this.winStage();
        });
      });
    }

    this.time.delayedCall(GAME_START_DELAY, () => {
      this.events.emit("dropper.start");
      this.pauseButton.setActive(true);
    });
  }

  createSoundListeners() {
    const walkSound = this.sound.add("walk", { loop: true });
    const crawlSound = this.sound.add("crawl", { loop: true });

    this.events.on(
      "sound.catch",
      ({
        type,
        airCount = 0,
        isLow = false,
        isRedundant = false,
        price = 0,
      }) => {
        if (airCount > 0)
          this.playSoundEffect(`air-catch-${Math.min(airCount, 5)}`);
        switch (type) {
          case "matsurisu":
            if (isLow) this.playSoundEffect("matsurisu-low-catch");
            else this.playSoundEffect("matsurisu-catch");
            break;
          case "coin":
            this.playSoundEffect("coin-catch");
            break;
          case "powerup":
            if (isRedundant) this.playSoundEffect("ebifrion-catch");
            else {
              this.playSoundEffect("powerup-catch");
              if (price > 0) this.playSoundEffect("shop-buy");
            }
            break;
          case "ebifrion":
            this.playSoundEffect("ebifrion-catch");
            break;
        }
      }
    );
    this.events.on("sound.jump", () => {
      const state = store.getState();
      const boosted = state.player.physics.modifiers.some((mod) =>
        mod.key.startsWith("Powerup:Jump")
      );
      this.playSoundEffect("jump" + (boosted ? "-boosted" : ""));
    });
    this.events.on("sound.walk", ({ crouching, airborne }) => {
      const volume = store.getState().settings.volumeSfx;
      if (airborne) {
        walkSound.stop();
        crawlSound.stop();
        return;
      }
      if (crouching) {
        walkSound.stop();
        if (crawlSound.isPlaying) return;
        crawlSound.play({ volume });
        return;
      }
      if (walkSound.isPlaying) return;
      walkSound.play({ volume });
    });
    this.events.on("sound.slide", () => this.playSoundEffect("slide"));
    this.events.on("sound.idle", () => {
      walkSound.stop();
      crawlSound.stop();
    });

    this.events.on("global.gameOver", () => {
      walkSound.stop();
      crawlSound.stop();
    });

    this.events.on("destroy", () => {
      walkSound.stop();
      crawlSound.stop();
      walkSound.destroy();
      crawlSound.destroy();
      this.bgm?.stop?.();
      this.bgm?.destroy?.();
      this.feverMusic?.stop?.();
      this.feverMusic?.destroy?.();
    });
  }

  activateEquipment() {
    const state = store.getState();
    state.player.equipment.forEach(({ target }) => target?.apply(this));
  }

  setAirForgiveness() {
    if (this.matsuri.airborne) return;
    const state = store.getState();
    store.dispatch({ type: "score.addAirForgiveness" });
    this.time.delayedCall(state.player.physics.airForgivenessDuration, () => {
      if (!this.matsuri.airborne)
        store.dispatch({ type: "score.removeAirForgiveness" });
    });
  }

  createSounds() {
    const settings = store.getState().settings;
    this.bgm = this.sound.add("matsuri-samba", {
      loop: true,
      volume: STAGE_BGM_VOLUME_FACTOR * settings.volumeMusic,
    });
    this.bgm.addMarker({
      name: "fever-resume",
      start: 2.19,
      config: {
        loop: true,
        volume: STAGE_BGM_VOLUME_FACTOR * settings.volumeMusic,
      },
    });
    this.feverMusic = this.sound.add("fever-music", {
      volume: STAGE_BGM_VOLUME_FACTOR * settings.volumeMusic,
    });
  }

  fadeBgm(duration) {
    this.tweens.add({
      targets: this.bgm,
      volume: 0.0,
      duration,
      onComplete: () => this.bgm.stop(),
    });
  }

  refreshMusicVolume() {
    const volumeMusic = store.getState().settings.volumeMusic;
    this.bgm.setVolume(STAGE_BGM_VOLUME_FACTOR * volumeMusic);
    this.feverMusic.setVolume(STAGE_BGM_VOLUME_FACTOR * volumeMusic);
  }

  toggleMute() {
    store.dispatch({ type: "settings.toggleMute" });
    this.muteButton.setFrame(store.getState().settings.mute ? 1 : 0);
  }

  maybeShowInstructions() {
    const shown = store.getState().settings.viewedInstructions;
    if (shown) return;
    this.scene.pause();
    this.scene.add("InstructionsModal", InstructionsModal, false, {
      parentSceneKey: this.scene.key,
    });
    this.scene.moveBelow("Curtains", "InstructionsModal");
    this.scene.launch("InstructionsModal");
  }

  pauseGame() {
    const transitioning = this.scene?.systems?.isTransitioning();
    const paused = this.scene?.isPaused(this.scene.key);
    if (
      paused ||
      paused === undefined ||
      transitioning ||
      transitioning === undefined
    )
      return false;
    this.sound.pauseAll();
    this.scene.add("PauseScreen", PauseScreen, true, {
      parentSceneKey: this.scene.key,
    });
    this.scene.pause();
    return true;
  }

  resumeGame() {
    const state = store.getState();
    this.pauseButton.setVisible();
    this.muteButton.setFrame(state.settings.mute ? 1 : 0);
    this.sound.resumeAll();
    this.refreshMusicVolume();
  }

  activateFever() {
    this.bgm.stop();
    this.feverMusic.play();
    this.events.once("global.feverEnd", () => {
      this.bgm.play("fever-resume");
      this.refreshMusicVolume();
    });
    const feverBack = this.add
      .image(WIDTH / 2, HEIGHT / 2, "stage-background-fever")
      .setDepth(DEPTH.BGBACK + 1);
    store.dispatch({ type: "global.activateFever" });
    const state = store.getState();
    const feverDuration = state.stage.fever.duration * 1000;
    this.time.delayedCall(feverDuration - EFFECT_FADE_DURATION, () =>
      this.events.emit("global.feverTimeout", EFFECT_FADE_DURATION)
    );
    const spotlights = [
      {
        x: -360,
        color: "green",
        rotation: 0.16 * Math.PI,
        delta: 0.07 * Math.PI,
      },
      {
        x: WIDTH + 360,
        color: "green",
        rotation: -0.16 * Math.PI,
        delta: -0.07 * Math.PI,
      },
      {
        x: -100,
        color: "yellow",
        rotation: 0.18 * Math.PI,
        delta: 0.16 * Math.PI,
      },
      {
        x: WIDTH + 100,
        color: "yellow",
        rotation: -0.18 * Math.PI,
        delta: -0.16 * Math.PI,
      },
    ].map(({ x, color, rotation, delta }) => {
      const spotlight = this.add
        .image(x, 980, `fever-spotlight-${color}`)
        .setDepth(DEPTH.BGFRONT)
        .setOrigin(0.5, 1)
        .setBlendMode(Phaser.BlendModes.SCREEN)
        .setRotation(rotation);
      const spotlightTween = this.tweens.add({
        targets: spotlight,
        rotation: rotation + delta,
        duration: 1500,
        ease: "Quad.easeInOut",
        yoyo: true,
        repeat: Infinity,
      });
      return { target: spotlight, tween: spotlightTween };
    });

    this.time.delayedCall(feverDuration, () => {
      store.dispatch({ type: "global.deactivateFever" });
      this.events.emit("global.feverEnd");
      this.tweens.add({
        targets: feverBack,
        alpha: 0,
        duration: 500,
        onComplete: () => feverBack.destroy(),
      });
      spotlights.forEach(({ target, tween }) =>
        this.tweens.add({
          targets: target,
          alpha: 0,
          duration: 500,
          onComplete: () => {
            this.tweens.remove(tween);
            target.destroy();
          },
        })
      );
    });
  }

  loseStage() {
    this.time.clearPendingEvents();
    this.matsuri.disable();
    this.dropper.pause();
    this.pauseButton.setActive(false);
    this.fadeBgm(1000);
    this.time.delayedCall(GAME_END_DELAY, () => this.gameOver());
  }

  winStage() {
    this.matsuri.disable();
    this.time.clearPendingEvents();
    this.events.emit("stage.clearEffects");
    this.dropper.pause();
    this.pauseButton.setActive(false);
    store.dispatch({ type: "global.winStage" });
    const state = store.getState();
    if (state.stage.level === state.stage.maxLevel) {
      this.gameOver();
    } else {
      this.curtainsTo("Shop", Shop);
    }
  }

  gameOver() {
    this.curtainsTo("Results", Results);
  }

  alignEffects() {
    Phaser.Actions.GridAlign(this.effects, {
      width: -1,
      height: 1,
      cellWidth: -90,
      cellHeight: 90,
      position: Phaser.Display.Align.CENTER,
      x: 670,
      y: 120,
    });
  }

  addEffect({ texture, frame, sound, duration }) {
    this.playSoundEffect(`${sound}-start`);
    this.events.once("destroy", () => this.sound.stopByKey(`${sound}-start`));

    const newEffect = this.add
      .image(0, 0, texture, frame)
      .setOrigin(0.5, 0.5)
      .setDepth(DEPTH.UIFRONT)
      .setScale(0.75, 0.75);
    this.effects.push(newEffect);
    this.alignEffects();

    this.time.delayedCall(duration - EFFECT_FADE_DURATION, () => {
      this.playSoundEffect(`${sound}-timeout`);
      this.events.once("destroy", () =>
        this.sound.stopByKey(`${sound}-timeout`)
      );
      this.tweens.add({
        targets: newEffect,
        alpha: 0,
        yoyo: true,
        duration: EFFECT_BLINK_DURATION,
        repeat:
          Math.floor(EFFECT_FADE_DURATION / (EFFECT_BLINK_DURATION * 2)) - 1,
        onComplete: (blinkTween) => {
          this.tweens.remove(blinkTween);
          this.tweens.add({
            targets: newEffect,
            alpha: 0,
            duration: EFFECT_BLINK_DURATION,
            onComplete: (fadeTween) => {
              this.tweens.remove(fadeTween);
              this.effects.splice(this.effects.indexOf(newEffect), 1);
              newEffect.destroy();
              this.alignEffects();
            },
          });
        },
      });
    });
  }

  update(time) {
    this.matsuri.update(time);
    this.dropper.update(time);
  }
}
