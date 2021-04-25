import store from "../../store";
import Item from "./item";

export default class DispatchItem extends Item {
  constructor({
    name,
    tier,
    texture,
    frame,
    action,
    price,
    purchaseLimit,
    purchaseConditions,
    buySideEffect,
  }) {
    super("dispatch", {
      name,
      tier,
      texture,
      frame,
      price,
      purchaseLimit,
      purchaseConditions,
      buySideEffect,
    });
    this.action = action;
  }

  handleBuy() {
    let action;
    if (this.action instanceof Function) {
      action = this.action(store.getState());
    } else {
      action = this.action;
    }
    store.dispatch(action);
  }
}
