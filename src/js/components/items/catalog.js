import { CATCH_MESSAGE_STYLE, DEPTH } from "../../globals";
import store from "../../store";
import { addTextEffect, chooseFromArray } from "../../utils";
import DispatchItem from "./dispatch";
import Powerup from "./powerup";

function getInitialCatalog() {
  return {
    // POWERUPS
    powerups: [
      new Powerup({
        name: "Speed",
        tier: 1,
        target: "player.physics",
        texture: "powerups",
        frame: 2,
        modifier: {
          op: "multiply",
          maxVelocity: 1.25,
          acceleration: 1.25,
          drag: 1.25,
        },
        duration: 15,
        price: 1000,
        conflictsWith: ["SpeedPlus"],
        applySideEffect: (scene) => {
          const config = {
            blendMode: "OVERLAY",
            frequency: 30,
            lifespan: 400,
            follow: scene.matsuri.bodySprite,
            radial: true,
            alpha: { min: 0.3, max: 0.8 },
            speed: { min: 100, max: 150 },
            angle: { min: 0, max: 359 },
            scale: { start: 1, end: 0.3 },
          };
          const particlesTop = scene.add
            .particles("particle-speed")
            .setDepth(DEPTH.PLAYERDEPTH + 1);
          particlesTop.createEmitter(config);
          const particlesBot = scene.add
            .particles("particle-speed")
            .setDepth(DEPTH.PLAYERDEPTH - 1);
          particlesBot.createEmitter(config);
          scene.time.delayedCall(15000, () => {
            particlesTop.destroy();
            particlesBot.destroy();
          });
        },
      }),
      new Powerup({
        name: "Jump",
        tier: 1,
        target: "player.physics",
        texture: "powerups",
        frame: 3,
        modifier: {
          op: "multiply",
          jumpVelocity: 1.17,
          jumpAcceleration: 1.17,
        },
        duration: 15,
        price: 1000,
        conflictsWith: ["JumpPlus"],
      }),
      new Powerup({
        name: "Float",
        tier: 2,
        target: "stage.matsurisu",
        frame: 3,
        modifier: { op: "multiply", fallSpeed: 0.75 },
        duration: 15,
        price: 1500,
        conflictsWith: ["FloatPlus"],
        applySideEffect: (scene) => {
          scene.dropper.addExtra({
            key: "Float",
            duration: 15,
            texture: "items",
            frame: 3,
            depth: 1,
            y: -80,
          });
        },
      }),
      new Powerup({
        name: "SpeedPlus",
        tier: 3,
        target: "player.physics",
        texture: "powerups",
        frame: 6,
        modifier: {
          op: "multiply",
          maxVelocity: 1.5,
          acceleration: 1.5,
          drag: 1.5,
        },
        duration: 20,
        price: 2500,
        conflictsWith: ["Speed"],
        applySideEffect: (scene) => {
          const config = {
            blendMode: "OVERLAY",
            frequency: 30,
            lifespan: 400,
            follow: scene.matsuri.bodySprite,
            radial: true,
            alpha: { min: 0.3, max: 0.8 },
            speed: { min: 100, max: 150 },
            angle: { min: 0, max: 359 },
            scale: { start: 1, end: 0.5 },
            quantity: 2,
          };
          const particlesTop = scene.add
            .particles("particle-speed")
            .setDepth(DEPTH.PLAYERDEPTH + 1);
          particlesTop.createEmitter(config);
          const particlesBot = scene.add
            .particles("particle-speed")
            .setDepth(DEPTH.PLAYERDEPTH - 1);
          particlesBot.createEmitter(config);
          scene.time.delayedCall(20000, () => {
            particlesTop.destroy();
            particlesBot.destroy();
          });
        },
      }),
      new Powerup({
        name: "JumpPlus",
        tier: 4,
        target: "player.physics",
        texture: "powerups",
        frame: 7,
        modifier: {
          op: "multiply",
          jumpVelocity: 1.33,
          jumpAcceleration: 1.33,
        },
        duration: 20,
        price: 2500,
        conflictsWith: ["Jump"],
      }),
      new Powerup({
        name: "FloatPlus",
        tier: 5,
        target: "stage.matsurisu",
        texture: "powerups",
        frame: 5,
        modifier: { op: "multiply", fallSpeed: 0.5 },
        duration: 20,
        price: 3500,
        conflictsWith: ["Float"],
      }),
    ],

    // DISPATCH ITEMS
    dispatchItems: [
      new DispatchItem({
        name: "1up",
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
      new DispatchItem({
        name: "Ebifrion",
        tier: 3,
        frame: 0,
        action: { type: "score.catchEbifrion" },
        price: 4000,
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

export function resetCatalog() {
  CATALOG = getInitialCatalog();
}

export function getAvailablePowerups() {
  const state = store.getState();
  const level = state.stage.level;
  return CATALOG.powerups.filter((powerup) => powerup.tier <= level);
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
