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
    let actions;
    if (Array.isArray(this.action)) {
      actions = this.action;
    } else {
      actions = [this.action];
    }
    actions.forEach((action) => store.dispatch(action));
  }
}
