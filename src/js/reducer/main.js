import playerReducer, { playerDefaultState } from "./player";

const mainDefaultState = {
  player: playerDefaultState,
};

export default function mainReducer(state = mainDefaultState, action) {
  return {
    ...state,
    player: playerReducer(state.player, action),
  };
}
