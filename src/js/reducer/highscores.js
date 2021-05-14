import { descendingSortedIndex } from "../utils";

export const highscoresDefaultState = {
  highscores: [],
  lastIndex: 0,
};

export default function highscoresReducer(state, action) {
  const { type, payload } = action;
  switch (type) {
    case "highscores.add":
      const index = descendingSortedIndex(
        state.highscores,
        payload,
        (v) => v.score
      );
      // Unlikely to cause a problem, but limit the number of scores we store
      const newHighscores = state.highscores.slice(0, 10);
      newHighscores.splice(index, 0, { score: payload, time: Date.now() });
      return {
        ...state,
        highscores: newHighscores,
        lastIndex: index,
      };
    case "global.clearData":
      return highscoresDefaultState;
    default:
      return state;
  }
}
