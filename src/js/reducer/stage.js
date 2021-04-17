import { addModifierWithoutDuplicates } from "../utils";

const matsurisuDefaultState = {
  number: 30,
  minX: 50,
  maxX: 670,
  minSpacingX: 100,
  maxSpacingX: 400,
  minSpacingY: 200,
  maxSpacingY: 400,
  minDistance: 300,
  fallSpeed: 200,
  modifiers: [],
};

const moneyDefaultState = {
  minNumber: 5,
  maxNumber: 10,
  minX: 50,
  maxX: 670,
  fallSpeed: 250,
  modifiers: [],
};

export const stageDefaultState = {
  difficulty: 1,
  matsurisu: matsurisuDefaultState,
  money: moneyDefaultState,
};

function matsurisuReducer(state = matsurisuDefaultState, action) {
  const { type, payload } = action;
  switch (type) {
    case "stage.matsurisu.addModifier":
      return addModifierWithoutDuplicates(state, payload);
    case "stage.matsurisu.removeModifier":
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

function moneyReducer(state = moneyDefaultState, action) {
  const { type, payload } = action;
  switch (type) {
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

export default function stageReducer(state = stageDefaultState, action) {
  const { type, payload } = action;
  switch (type) {
    default:
      return {
        ...state,
        matsurisu: matsurisuReducer(state.matsurisu, action),
        money: moneyReducer(state.money, action),
      };
  }
}
