import { applyMiddleware, createStore } from "redux";
import mainReducer, { mainDefaultState } from "./reducer/main";
import * as ReduxLocalStorage from "redux-localstorage-simple";
import { resetCatalog } from "./components/items/catalog";

const localStorageConfig = {
  states: ["settings", "highscores"],
  namespace: "matsurisu-panic",
  namespaceSeparator: ":",
  preloadedState: mainDefaultState,
  disableWarnings: true,
};

// Maintain a reference to the game, set dynamically to prevent circular imports
let gameRef;

const sideEffects = (storeAPI) => (next) => (action) => {
  const { type, payload } = action;
  switch (type) {
    case "global.newGame":
      resetCatalog();
      break;
    case "global.clearData":
      ReduxLocalStorage.clear();
      break;
  }
  const result = next(action);
  const newState = storeAPI.getState();
  switch (type) {
    case "settings.toggleMute":
      if (gameRef !== undefined) gameRef.sound.mute = newState.settings.mute;
      break;
  }

  return result;
};

const createStoreWithMiddleware = applyMiddleware(
  sideEffects,
  ReduxLocalStorage.save(localStorageConfig)
)(createStore);

const store = createStoreWithMiddleware(
  mainReducer,
  ReduxLocalStorage.load(localStorageConfig)
);

// This bit only matters for some playtesters who played during the brief time the Japanese language code was "jp" instead of ISO's "ja"
if (store.getState().settings.language === "jp")
  store.dispatch({ type: "settings.setJapanese" });

export function setStoreGameRef(game) {
  gameRef = game;
}

export default store;
