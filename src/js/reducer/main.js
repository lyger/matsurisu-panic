import stageReducer, { stageDefaultState } from "./stage";
import playerReducer, { playerDefaultState } from "./player";
import scoreReducer, { scoreDefaultState } from "./score";
import shopReducer, { shopDefaultState } from "./shop";
import settingsReducer, { settingsDefaultState } from "./settings";
import highscoresReducer, { highscoresDefaultState } from "./highscores";

export const mainDefaultState = {
  stage: stageDefaultState,
  player: playerDefaultState,
  score: scoreDefaultState,
  shop: shopDefaultState,
  settings: settingsDefaultState,
  highscores: highscoresDefaultState,
};

export default function mainReducer(state = mainDefaultState, action) {
  const { type, payload } = action;
  switch (type) {
    case "global.newGame":
      return mainDefaultState;
    default:
      return {
        ...state,
        stage: stageReducer(state.stage, action),
        player: playerReducer(state.player, action),
        score: scoreReducer(state.score, action),
        shop: shopReducer(state.shop, action),
        settings: settingsReducer(state.settings, action),
        highscores: highscoresReducer(state.highscores, action),
      };
  }
}
