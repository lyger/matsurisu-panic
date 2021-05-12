import store from "../../store";
import Item from "./item";

export default class DispatchItem extends Item {
  constructor({
    name,
    description,
    tier,
    texture,
    frame,
    action,
    price,
    purchaseLimit,
    purchaseSound,
    purchaseConditions,
    buySideEffect,
  }) {
    super("dispatch", {
      name,
      description,
      tier,
      texture,
      frame,
      price,
      purchaseLimit,
      purchaseSound,
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
