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
};

const moneyDefaultState = {
  minNumber: 5,
  maxNumber: 10,
  minX: 50,
  maxX: 670,
  fallSpeed: 250,
};

export const stageDefaultState = {
  difficulty: 1,
  matsurisu: matsurisuDefaultState,
  money: moneyDefaultState,
};

export default function stageReducer(state = stageDefaultState, action) {
  switch (action) {
    default:
      return state;
  }
}
