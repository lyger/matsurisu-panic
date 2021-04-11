import { createStore } from "redux";
import mainReducer, { mainDefaultState } from "./reducer/main";

const store = createStore(mainReducer);
export default store;
