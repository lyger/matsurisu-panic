function roundToFive(n) {
  return Math.floor(n / 5) * 5;
}

export const scoreDefaultState = {
  score: 0,
  lives: 3,
  money: 0,
  maxLives: 10,
  maxMoney: 99999,
  combo: 0,
  bestCombo: 0,
  moneyPerCoin: 500,
  scorePerCatch: 100,
  scorePerEbifrion: 2000,
  bonusPerCombo: 5,
  lowMultiplier: 2,
  highMultiplier: 1.5,
  minCombo: 5,
  maxCombo: 25,
  results: {
    livesMultiplier: 1500,
    moneyMultiplier: 0.2,
    bestComboMultiplier: 200,
  },
};

export default function scoreReducer(state = scoreDefaultState, action) {
  const { type, payload } = action;
  switch (type) {
    case "score.catch":
      const newCombo = state.combo + 1;
      const comboBonus =
        Math.max(Math.min(newCombo, state.maxCombo) - state.minCombo, 0) *
        state.bonusPerCombo;
      const multiplier = payload.isLow
        ? state.lowMultiplier
        : payload.isHigh
        ? state.highMultiplier
        : 1;
      return {
        ...state,
        combo: newCombo,
        bestCombo: Math.max(newCombo, state.bestCombo),
        score:
          state.score +
          roundToFive((state.scorePerCatch + comboBonus) * multiplier),
      };
    case "score.catchEbifrion":
      return {
        ...state,
        score: state.score + state.scorePerEbifrion,
      };
    case "score.addScore":
      // Should only be used in the rare case when score needs to be manually adjusted, otherwise use "score.catch"
      return {
        ...state,
        score: state.score + payload,
      };
    case "score.drop":
      return {
        ...state,
        combo: 0,
        lives: Math.max(state.lives - 1, 0),
      };
    case "score.loseLife":
      // Should only be used in the rare case when lives need to be manually adjusted, otherwise use "score.drop"
      return {
        ...state,
        lives: Math.max(state.lives - (payload || 1), 0),
      };
    case "score.gainLife":
      return {
        ...state,
        lives: Math.min(state.lives + (payload || 1), state.maxLives),
      };
    case "score.loseMoney":
      return {
        ...state,
        money: Math.max(state.money - (payload || 1), 0),
      };
    case "score.gainCoin":
      return {
        ...state,
        money: Math.min(state.money + state.moneyPerCoin, state.maxMoney),
      };
    case "score.gainMoney":
      // Should only be used in the rare case when money needs to be manually adjusted, otherwise use "score.gainCoin"
      return {
        ...state,
        money: Math.min(state.money + (payload | 1), state.maxMoney),
      };
    case "score.resetCombo":
      return {
        ...state,
        combo: 0,
      };
    default:
      return state;
  }
}
