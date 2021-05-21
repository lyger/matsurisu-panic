import store from "../../store";
import Item from "./item";

export default class Equipment extends Item {
  constructor({
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
    depth = 1,
    onActivation,
  }) {
    super("equipment", {
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
    this.depth = depth;
    this.activated = false;
    this.onActivation = onActivation;
  }

  handleBuy() {
    store.dispatch({
      type: "player.addEquipment",
      payload: {
        key: "Equipment:" + this.name,
        texture: this.texture,
        animationName: this.name.toLowerCase(),
        depth: this.depth,
        target: this,
      },
    });
  }

  apply(scene) {
    if (this.activated) return false;
    this.onActivation(scene);
    this.activated = true;
    return true;
  }
}
