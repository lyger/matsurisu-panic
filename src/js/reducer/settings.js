export const settingsDefaultState = {
  mute: false,
  volumeMusic: 1,
  volumeSfx: 1,
  language: "ja",
  viewedInstructions: false,
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
        language: "ja",
      };
    case "settings.viewInstructions":
      return {
        ...state,
        viewedInstructions: true,
      };
    default:
      return state;
  }
}
