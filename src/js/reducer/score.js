export const scoreDefaultState = {
  score: 0,
  lives: 3,
  money: 0,
  maxLives: 6,
  maxMoney: 50,
};

export default function scoreReducer(state = scoreDefaultState, action) {
  const { type, payload } = action;
  switch (type) {
    case "score.addScore":
      return {
        ...state,
        score: state.score + payload,
      };
    case "score.loseLife":
      return {
        ...state,
        lives: Math.max(state.lives - (payload | 1), 0),
      };
    case "score.gainLife":
      return {
        ...state,
        lives: Math.min(state.lives + (payload | 1), state.maxLives),
      };
    case "score.loseMoney":
      return {
        ...state,
        money: Math.max(state.money - (payload | 1), 0),
      };
    case "score.gainMoney":
      return {
        ...state,
        money: Math.min(state.money + (payload | 1), state.maxMoney),
      };
    default:
      return state;
  }
}
