const visibilityDefaultState = {
  catears: true,
  glasses: true,
  glowstick: true,
};

export const settingsDefaultState = {
  mute: false,
  volumeMusic: 1,
  volumeSfx: 1,
  language: "ja",
  viewedInstructions: false,
  endlessUnlocked: false,
  visibility: visibilityDefaultState,
};

function visibilityReducer(state = visibilityDefaultState, action) {
  const { type, payload } = action;
  switch (type) {
    case "settings.visibility.showCatEars":
      return {
        ...state,
        catears: true,
      };
    case "settings.visibility.hideCatEars":
      return {
        ...state,
        catears: false,
      };
    case "settings.visibility.showGlasses":
      return {
        ...state,
        glasses: true,
      };
    case "settings.visibility.hideGlasses":
      return {
        ...state,
        glasses: false,
      };
    default:
      return state;
  }
}

export default function settingsReducer(state = settingsDefaultState, action) {
  const { type, payload } = action;
  switch (type) {
    case "settings.toggleMute":
      return {
        ...state,
        mute: !state.mute,
      };
    case "settings.setVolumeMusic":
      return {
        ...state,
        volumeMusic: payload,
      };
    case "settings.setVolumeSfx":
      return {
        ...state,
        volumeSfx: payload,
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
    case "settings.unlockEndless":
      return {
        ...state,
        endlessUnlocked: true,
      };
    case "settings.viewInstructions":
      return {
        ...state,
        viewedInstructions: true,
      };
    case "global.clearData":
      return settingsDefaultState;
    default:
      return {
        ...state,
        visibility: visibilityReducer(state.visibility, action),
      };
  }
}
