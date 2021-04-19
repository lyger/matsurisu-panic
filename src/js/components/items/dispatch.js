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
  }) {
    super("dispatch", {
      name,
      tier,
      texture,
      frame,
      price,
      purchaseLimit,
      purchaseConditions,
    });
    this.action = action;
  }

  handleBuy() {
    store.dispatch(this.action);
  }
}
