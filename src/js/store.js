import { applyMiddleware, createStore } from "redux";
import mainReducer, { mainDefaultState } from "./reducer/main";
import { save, load } from "redux-localstorage-simple";

const localStorageConfig = {
  states: ["settings", "highscores"],
  namespace: "matsurisu-panic",
  namespaceSeparator: ":",
  preloadedState: mainDefaultState,
  disableWarnings: true,
};

const createStoreWithMiddleware = applyMiddleware(save(localStorageConfig))(
  createStore
);

const store = createStoreWithMiddleware(mainReducer, load(localStorageConfig));
export default store;
