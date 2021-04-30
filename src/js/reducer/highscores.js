export const highscoresDefaultState = {
  highscores: [],
};

export default function highscoresReducer(state, action) {
  const { type, payload } = action;
  switch (type) {
    case "highscores.add":
      const newHighscores = state.highscores.slice();
      newHighscores.push({ score: payload, time: Date.now() });
      // Sort descending
      newHighscores.sort((a, b) => b.score - a.score);
      return {
        ...state,
        highscores: newHighscores,
      };
    default:
      return state;
  }
}
