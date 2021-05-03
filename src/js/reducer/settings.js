export const settingsDefaultState = {
  mute: false,
  volumeMusic: 1,
  volumeSfx: 1,
  language: "jp",
};

export default function settingsReducer(state = settingsDefaultState, action) {
  const { type, payload } = action;
  switch (type) {
    case "settings.toggleMute":
      return {
        ...state,
        mute: !state.mute,
      };
    case "settings.setEnglish":
      return {
        ...state,
        language: "en",
      };
    case "settings.setJapanese":
      return {
        ...state,
        language: "jp",
      };
    default:
      return state;
  }
}
