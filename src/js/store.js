import { applyMiddleware, createStore } from "redux";
import mainReducer, { mainDefaultState } from "./reducer/main";
import { save, load } from "redux-localstorage-simple";
import { resetCatalog } from "./components/items/catalog";

const localStorageConfig = {
  states: ["settings", "highscores"],
  namespace: "matsurisu-panic",
  namespaceSeparator: ":",
  preloadedState: mainDefaultState,
  disableWarnings: true,
};

const sideEffects = (storeAPI) => (next) => (action) => {
  const { type, payload } = action;
  switch (type) {
    case "global.newGame":
      resetCatalog();
      break;
  }
  return next(action);
};

const createStoreWithMiddleware = applyMiddleware(
  sideEffects,
  save(localStorageConfig)
)(createStore);

const store = createStoreWithMiddleware(mainReducer, load(localStorageConfig));

// This bit only matters for some playtesters who played during the brief time the Japanese language code was "jp" instead of ISO's "ja"
if (store.getState().settings.language === "jp")
  store.dispatch({ type: "settings.setJapanese" });

export default store;
