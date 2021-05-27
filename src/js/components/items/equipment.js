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
    resultsFlag,
    onActivation,
    accessory = null,
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
    this.resultsFlag = resultsFlag;
    this.accessory = accessory;
  }

  handleBuy() {
    store.dispatch({
      type: "player.addEquipment",
      payload: {
        key: "Equipment:" + this.name,
        accessory: false,
        texture: this.texture,
        frame: this.frame,
        resultsFlag: this.resultsFlag,
        animationName: this.name.toLowerCase(),
        depth: this.depth,
        target: this,
      },
    });
    if (this.accessory !== null)
      store.dispatch({
        type: "player.addEquipment",
        payload: {
          key: "Equipment:" + this.name + ".accessory",
          accessory: true,
          animationName: this.accessory.name.toLowerCase(),
          depth: this.accessory.depth,
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
