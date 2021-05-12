import { DEPTH } from "../../globals";
import store from "../../store";
import { addTextEffect, chooseFromArray } from "../../utils";
import DispatchItem from "./dispatch";
import Powerup from "./powerup";

function getInitialCatalog() {
  return {
    // POWERUPS
    powerups: [
      // ========== SPEED ==========
      new Powerup({
        name: "Speed",
        description: { en: "Speed Boost", ja: "スピードアップ" },
        tier: 1,
        target: "player.physics",
        frame: 5,
        sound: "stim",
        modifier: {
          op: "multiply",
          maxVelocity: 1.2,
          acceleration: 1.2,
          drag: 1.5,
        },
        duration: 25,
        price: 1000,
        purchaseLimit: 1,
        conflictsWith: ["SpeedPlus"],
        applySideEffect: (scene) => {
          const config = {
            blendMode: "COLOR",
            frame: [0, 1, 2, 3],
            frequency: 30,
            lifespan: 400,
            follow: scene.matsuri.bodySprite,
            followOffset: { x: 0, y: 30 },
            radial: true,
            rotate: { min: 0, max: 359 },
            alpha: { start: 0.8, end: 0 },
            speed: { min: 100, max: 150 },
            angle: { min: 0, max: 359 },
            scale: { start: 1, end: 0.3 },
          };
          const particlesTop = scene.add
            .particles("particle-speed")
            .setDepth(DEPTH.PLAYERDEPTH + 1);
          particlesTop.createEmitter({
            ...config,
            alpha: { start: 0.2, end: 0 },
          });
          const particlesBot = scene.add
            .particles("particle-speed")
            .setDepth(DEPTH.PLAYERDEPTH - 1);
          particlesBot.createEmitter(config);
          scene.time.delayedCall(25000, () => {
            particlesTop.destroy();
            particlesBot.destroy();
          });
        },
      }),
      // ========== JUMP ==========
      new Powerup({
        name: "Jump",
        description: { en: "Jump Boost", ja: "ジャンプ力アップ" },
        tier: 1,
        target: "player.physics",
        frame: 7,
        sound: "bunny",
        modifier: {
          op: "multiply",
          jumpVelocity: 1.33,
          gravity: 1.17,
          jumpAcceleration: 1.17,
          quickFallAcceleration: 1.17,
        },
        duration: 25,
        price: 1000,
        purchaseLimit: 1,
        conflictsWith: ["JumpPlus"],
        applySideEffect: (scene) => {
          const particles = scene.add
            .particles("particle-bunny")
            .setDepth(DEPTH.PLAYERDEPTH + 1);
          const emitter = particles.createEmitter({
            frame: [0, 1, 2, 3],
            lifespan: 600,
            radial: true,
            gravityY: 200,
            scale: { min: 0.4, max: 0.8 },
            rotate: { min: 0, max: 359 },
            alpha: { start: 1, end: 0, ease: "Quad.easeIn" },
            speed: { min: 150, max: 250 },
            angle: { min: 180, max: 360 },
            quantity: { min: 6, max: 8 },
          });
          emitter.explode(0);
          const jumpCallback = () => {
            emitter.setPosition(
              scene.matsuri.bodySprite.x,
              scene.matsuri.bodySprite.y + 100
            );
            emitter.explode();
          };
          scene.matsuri.on("jump", jumpCallback);
          scene.time.delayedCall(25000, () => {
            scene.matsuri.off("jump", jumpCallback);
            particles.destroy();
          });
        },
      }),
      // ========== FLOAT ==========
      new Powerup({
        name: "Float",
        description: { en: "Slow Fall", ja: "落下速度ダウン" },
        tier: 2,
        target: "stage.matsurisu",
        frame: 3,
        sound: "balloon",
        modifier: { op: "multiply", fallSpeed: 0.75 },
        duration: 20,
        price: 1500,
        purchaseLimit: 1,
        conflictsWith: ["FloatPlus"],
        applySideEffect: (scene) => {
          scene.dropper.addExtra({
            key: "Float",
            duration: 20,
            texture: "extra-balloons",
            frame: 0,
            depth: -1,
            y: -85,
          });
        },
      }),
      // ========== SPEED PLUS ==========
      new Powerup({
        name: "SpeedPlus",
        description: { en: "Speed Boost +", ja: "スピードアップ＋" },
        tier: 3,
        target: "player.physics",
        frame: 6,
        sound: "stim",
        modifier: {
          op: "multiply",
          maxVelocity: 1.33,
          acceleration: 1.33,
          drag: 1.5,
        },
        duration: 35,
        price: 2000,
        purchaseLimit: 1,
        conflictsWith: ["Speed"],
        applySideEffect: (scene) => {
          const config = {
            blendMode: "COLOR",
            frame: [0, 1, 2, 3],
            frequency: 40,
            lifespan: 400,
            follow: scene.matsuri.bodySprite,
            followOffset: { x: 0, y: 30 },
            radial: true,
            rotate: { min: 0, max: 359 },
            alpha: { start: 0.8, end: 0 },
            speed: { min: 100, max: 150 },
            angle: { min: 0, max: 359 },
            scale: { start: 1, end: 0.5 },
            quantity: 2,
          };
          const particlesTop = scene.add
            .particles("particle-speed")
            .setDepth(DEPTH.PLAYERDEPTH + 1);
          particlesTop.createEmitter({
            ...config,
            alpha: { start: 0.2, end: 0 },
          });
          const particlesBot = scene.add
            .particles("particle-speed")
            .setDepth(DEPTH.PLAYERDEPTH - 1);
          particlesBot.createEmitter(config);
          scene.time.delayedCall(35000, () => {
            particlesTop.destroy();
            particlesBot.destroy();
          });
        },
      }),
      // ========== JUMP PLUS ==========
      new Powerup({
        name: "JumpPlus",
        description: { en: "Jump Boost +", ja: "ジャンプ力アップ＋" },
        tier: 4,
        target: "player.physics",
        frame: 8,
        sound: "bunny",
        modifier: {
          op: "multiply",
          jumpVelocity: 1.5,
          gravity: 1.17,
          jumpAcceleration: 1.33,
          quickFallAcceleration: 1.33,
        },
        duration: 35,
        price: 2000,
        purchaseLimit: 1,
        conflictsWith: ["Jump"],
        applySideEffect: (scene) => {
          const particles = scene.add
            .particles("particle-bunny")
            .setDepth(DEPTH.PLAYERDEPTH + 1);
          const emitter = particles.createEmitter({
            frame: [0, 1, 2, 3],
            lifespan: 750,
            radial: true,
            gravityY: 200,
            scale: { min: 0.4, max: 0.8 },
            rotate: { min: 0, max: 359 },
            alpha: { start: 1, end: 0.2, ease: "Quad.easeIn" },
            speed: { min: 150, max: 250 },
            angle: { min: 180, max: 360 },
            quantity: { min: 8, max: 10 },
          });
          emitter.explode(0);
          const jumpCallback = () => {
            emitter.setPosition(
              scene.matsuri.bodySprite.x,
              scene.matsuri.bodySprite.y + 100
            );
            emitter.explode();
          };
          scene.matsuri.on("jump", jumpCallback);
          scene.time.delayedCall(25000, () => {
            scene.matsuri.off("jump", jumpCallback);
            particles.destroy();
          });
        },
      }),
      // ========== FLOAT PLUS ==========
      new Powerup({
        name: "FloatPlus",
        description: { en: "Slow Fall +", ja: "落下速度ダウン＋" },
        tier: 5,
        target: "stage.matsurisu",
        frame: 4,
        sound: "balloon",
        modifier: { op: "multiply", fallSpeed: 0.5 },
        duration: 30,
        price: 3000,
        purchaseLimit: 1,
        conflictsWith: ["Float"],
        applySideEffect: (scene) => {
          scene.dropper.addExtra({
            key: "FloatPlus",
            duration: 30,
            texture: "extra-balloons",
            frame: 0,
            depth: -1,
            y: -85,
          });
        },
      }),
    ],

    // DISPATCH ITEMS
    dispatchItems: [
      // ========== 1UP ==========
      new DispatchItem({
        name: "1up",
        description: { en: "1-Up", ja: "1UP" },
        tier: 1,
        frame: 1,
        action: { type: "score.gainLife" },
        price: 3000,
        purchaseConditions: [
          (state) => state.score.lives < state.score.maxLives,
        ],
        buySideEffect: (scene) => {
          addTextEffect(scene, {
            x: 155,
            y: 855,
            text: "+1",
            depth: DEPTH.UIFRONT + 1,
          });
        },
      }),
      // ========== EBIFRION ==========
      new DispatchItem({
        name: "Ebifrion",
        description: { en: "Score Bonus", ja: "スコアボーナス" },
        tier: 3,
        frame: 0,
        action: { type: "score.buyEbifrion" },
        price: 4000,
        purchaseSound: "ebifrion-catch",
        buySideEffect: (scene) => {
          const state = store.getState();
          addTextEffect(scene, {
            x: 142,
            y: 798,
            text: `+${state.score.scorePerEbifrion}`,
            depth: DEPTH.UIFRONT + 1,
          });
        },
      }),
    ],
  };
}

export let CATALOG = getInitialCatalog();
let [SPEED, JUMP, FLOAT, SPEED_PLUS, JUMP_PLUS, FLOAT_PLUS] = CATALOG.powerups;

export function resetCatalog() {
  CATALOG = getInitialCatalog();
  [SPEED, JUMP, FLOAT, SPEED_PLUS, JUMP_PLUS, FLOAT_PLUS] = CATALOG.powerups;
}

export function getAvailablePowerups() {
  const state = store.getState();
  const level = state.stage.level;
  return CATALOG.powerups.filter((powerup) => powerup.tier <= level);
}

export function combinePowerups(powerup1, powerup2) {
  switch (powerup1.name) {
    case "Speed":
      if (powerup2.name.startsWith("Speed")) return SPEED_PLUS;
      break;
    case "Jump":
      if (powerup2.name.startsWith("Jump")) return JUMP_PLUS;
      break;
    case "Float":
      if (powerup2.name.startsWith("Float")) return FLOAT_PLUS;
      break;
  }
  return null;
}

export function getShopItems() {
  const state = store.getState();
  const player = state.player;
  const level = state.stage.level;
  const filteredItems = CATALOG.powerups
    .concat(CATALOG.dispatchItems)
    .filter((item) => {
      return (
        item.tier <= level && item.canBuy && item.name !== player.powerup?.name
      );
    });

  return chooseFromArray(filteredItems, state.shop.numItems);
}
