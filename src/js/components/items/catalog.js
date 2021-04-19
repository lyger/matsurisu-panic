import store from "../../store";
import { chooseFromArray } from "../../utils";
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
      }),
      new Powerup({
        name: "Jump",
        tier: 1,
        target: "player.physics",
        texture: "powerups",
        frame: 3,
        modifier: {
          op: "multiply",
          jumpVelocity: 1.2,
          jumpAcceleration: 1.2,
        },
        duration: 15,
        price: 1000,
      }),
      new Powerup({
        name: "Float",
        tier: 2,
        target: "stage.matsurisu",
        frame: 3,
        modifier: { op: "multiply", fallSpeed: 0.75 },
        duration: 15,
        price: 1500,
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
      }),
      new Powerup({
        name: "JumpPlus",
        tier: 4,
        target: "player.physics",
        texture: "powerups",
        frame: 7,
        modifier: {
          op: "multiply",
          jumpVelocity: 1.4,
          jumpAcceleration: 1.4,
        },
        duration: 20,
        price: 2500,
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
  const level = state.stage.level;
  const filteredItems = CATALOG.powerups
    .concat(CATALOG.dispatchItems)
    .filter((item) => {
      return item.tier <= level && item.canBuy;
    });

  return chooseFromArray(filteredItems, state.shop.numItems);
}
