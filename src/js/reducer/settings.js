export const settingsDefaultState = {
  mute: false,
  volumeMusic: 1,
  volumeSfx: 1,
};

export default function settingsReducer(state = settingsDefaultState, action) {
  const { type, payload } = action;
  switch (type) {
    case "settings.toggleMute":
      return {
        ...state,
        mute: !state.mute,
      };
    default:
      return state;
  }
}
