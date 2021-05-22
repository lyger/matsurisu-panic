import { addModifierWithoutDuplicates } from "../utils";

const matsurisuDefaultState = {
  number: 30,
  bonusPerSpawn: 0,
  minX: 50,
  maxX: 670,
  minSpacingX: 100,
  maxSpacingX: 400,
  minSpacingY: 250,
  maxSpacingY: 450,
  minDistance: 300,
  maxInverseSlope: 1.4,
  slopeTurnaround: 200,
  fallSpeed: 200,
  lowCatchY: 810,
  modifiers: [],
};

const moneyDefaultState = {
  minNumber: 6,
  maxNumber: 8,
  luck: 0,
  minX: 50,
  maxX: 670,
  fallSpeed: 250,
  modifiers: [],
};

const powerupDefaultState = {
  minNumber: 0,
  maxNumber: 1,
  minX: 50,
  maxX: 670,
  fallSpeed: 150,
  modifiers: [],
};

const ebifrionDefaultState = {
  minX: 0,
  maxX: 720,
  fallDuration: 3500,
  modifiers: [],
};

const feverDefaultState = {
  number: 0,
  threshold: 0,
  duration: 20,
};

export const stageDefaultState = {
  level: 0,
  maxLevel: 10,
  showPreview: false,
  matsurisu: matsurisuDefaultState,
  money: moneyDefaultState,
  powerup: powerupDefaultState,
  ebifrion: ebifrionDefaultState,
  fever: feverDefaultState,
};

// This function reaches approx 2.16 by level 10 (n = 9)
function offsetSqrt(n) {
  return Math.sqrt(n + 1) - 1;
}

function matsurisuReducer(state = matsurisuDefaultState, action) {
  const { type, payload } = action;
  switch (type) {
    case "stage.increaseLevel":
      const i = payload - 1;
      return {
        ...state,
        number: Math.min(30 + i * 10, 100),
        fallSpeed: Math.min(200 + offsetSqrt(i) * 140, 600),
        minSpacingY: Math.min(250 + i * 20, 500),
        maxSpacingY: Math.min(450 + i * 15, 700),
        minDistance: Math.min(300 + offsetSqrt(i) * 20, 600),
      };
    case "stage.matsurisu.addModifier":
      return addModifierWithoutDuplicates(state, payload);
    case "stage.matsurisu.removeModifier":
      return {
        ...state,
        modifiers: state.modifiers.filter(
          (modifier) => modifier.key !== payload
        ),
      };
    case "global.activateFever":
      return addModifierWithoutDuplicates(state, {
        key: "Fever:BonusSpawns",
        op: "add",
        bonusPerSpawn: 2,
      });
    case "global.deactivateFever":
    case "global.winStage":
      return {
        ...state,
        modifiers: state.modifiers.filter(
          (modifier) => !modifier.key.startsWith("Fever:")
        ),
      };
    default:
      return state;
  }
}

function moneyReducer(state = moneyDefaultState, action) {
  const { type, payload } = action;
  switch (type) {
    case "stage.increaseLevel":
      const i = payload - 1;
      return {
        ...state,
        minNumber: Math.min(Math.floor(7 + i * 0.8), 10),
        maxNumber: Math.min(9 + i * 1.5, 20),
        fallSpeed: Math.min(250 + offsetSqrt(i) * 160, 700),
      };
    case "stage.money.addModifier":
      return addModifierWithoutDuplicates(state, payload);
    case "stage.money.removeModifier":
      return {
        ...state,
        modifiers: state.modifiers.filter(
          (modifier) => modifier.key !== payload
        ),
      };
    default:
      return state;
  }
}

function powerupReducer(state = powerupDefaultState, action) {
  const { type, payload } = action;
  switch (type) {
    case "stage.increaseLevel":
      const i = payload - 1;
      return {
        ...state,
        minNumber: Math.min(Math.floor(i * 0.2), 5),
        maxNumber: Math.min(Math.floor(1 + offsetSqrt(i) * 1.5), 15),
        fallSpeed: Math.min(150 + offsetSqrt(i) * 120, 500),
      };
    case "stage.powerup.addModifier":
      return addModifierWithoutDuplicates(state, payload);
    case "stage.powerup.removeModifier":
      return {
        ...state,
        modifiers: state.modifiers.filter(
          (modifier) => modifier.key !== payload
        ),
      };
    default:
      return state;
  }
}

function ebifrionReducer(state = ebifrionDefaultState, action) {
  const { type, payload } = action;
  switch (type) {
    case "stage.increaseLevel":
      const i = payload - 1;
      return {
        ...state,
        fallDuration: Math.max(3500 - offsetSqrt(i) * 200, 2500),
      };
    case "stage.ebifrion.addModifier":
      return addModifierWithoutDuplicates(state, payload);
    case "stage.ebifrion.removeModifier":
      return {
        ...state,
        modifiers: state.modifiers.filter(
          (modifier) => modifier.key !== payload
        ),
      };
    default:
      return state;
  }
}

function feverReducer(state = feverDefaultState, action) {
  const { type, payload } = action;
  switch (type) {
    case "stage.increaseLevel":
      const newLevel = payload;
      return {
        ...state,
        number:
          newLevel < 3
            ? 0
            : Math.min(Math.floor(newLevel * 2 + 2 + (newLevel - 3) / 3), 20),
        threshold: newLevel < 3 ? 0 : Math.min(newLevel * 2, 15),
      };
    default:
      return state;
  }
}

export default function stageReducer(state = stageDefaultState, action) {
  const { type, payload } = action;
  switch (type) {
    case "stage.increaseLevel":
      const newLevel = state.level + 1;
      const modifiedAction = { type, payload: newLevel };
      return {
        ...state,
        level: newLevel,
        matsurisu: matsurisuReducer(state.matsurisu, modifiedAction),
        money: moneyReducer(state.money, modifiedAction),
        powerup: powerupReducer(state.powerup, modifiedAction),
        ebifrion: ebifrionReducer(state.ebifrion, modifiedAction),
        fever: feverReducer(state.fever, modifiedAction),
      };
    case "stage.showPreview":
      return {
        ...state,
        showPreview: true,
      };
    case "stage.hidePreview":
      return {
        ...state,
        showPreview: false,
      };
    default:
      return {
        ...state,
        matsurisu: matsurisuReducer(state.matsurisu, action),
        money: moneyReducer(state.money, action),
        powerup: powerupReducer(state.powerup, action),
        ebifrion: ebifrionReducer(state.ebifrion, action),
        fever: feverReducer(state.fever, action),
      };
  }
}
