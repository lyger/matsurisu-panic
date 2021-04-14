import stageReducer, { stageDefaultState } from "./stage";
import playerReducer, { playerDefaultState } from "./player";
import scoreReducer, { scoreDefaultState } from "./score";

const mainDefaultState = {
  stage: stageDefaultState,
  player: playerDefaultState,
  score: scoreDefaultState,
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
      };
  }
}
