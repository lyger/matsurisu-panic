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
    onDeactivation,
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
    this.onDeactivation = onDeactivation;
    this.resultsFlag = resultsFlag;
    this.accessory = accessory;
  }

  get config() {
    return {
      key: "Equipment:" + this.name,
      accessory: this.accessory,
      texture: this.texture,
      frame: this.frame,
      resultsFlag: this.resultsFlag,
      animationName: this.name.toLowerCase(),
      depth: this.depth,
      target: this,
      stages: Infinity,
    };
  }

  handleBuy() {
    store.dispatch({
      type: "player.addEquipment",
      payload: this.config,
    });
  }

  apply(scene) {
    if (this.activated) return false;
    this.onActivation(scene);
    this.activated = true;
    return true;
  }

  remove(scene) {
    if (!this.activated) return false;
    this.onDeactivation(scene);
    this.activated = false;
    return true;
  }
}
