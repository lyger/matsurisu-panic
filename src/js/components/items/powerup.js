import store from "../../store";
import Item from "./item";

export default class Powerup extends Item {
  constructor({
    name,
    tier,
    texture,
    frame = 0,
    target,
    modifier,
    duration,
    price,
    purchaseLimit,
    purchaseConditions,
  }) {
    super("powerup", {
      name,
      tier,
      texture,
      frame,
      price,
      purchaseLimit,
      purchaseConditions,
    });
    if (modifier.key === undefined) modifier.key = "Powerup:" + name;
    this.target = target;
    this.modifier = modifier;
    this.duration = duration * 1000;
  }

  handleBuy() {
    store.dispatch({ type: "player.setPowerup", payload: this });
  }

  getTarget(state) {
    return this.target.split(".").reduce((st, key) => st[key], state);
  }

  apply(scene) {
    const oldState = this.getTarget(store.getState());
    const unsubscribe = store.subscribe(() => {
      unsubscribe();
      const newState = this.getTarget(store.getState());
      if (newState === oldState) return;
      scene.events.emit("stage.addEffect", {
        texture: this.texture,
        frame: this.frame,
        duration: this.duration,
      });
      scene.time.delayedCall(this.duration, () =>
        store.dispatch({
          type: `${this.target}.removeModifier`,
          payload: this.modifier.key,
        })
      );
    });
    scene.events.on("stage.clearEffects", () =>
      store.dispatch({
        type: `${this.target}.removeModifier`,
        payload: this.modifier.key,
      })
    );
    store.dispatch({
      type: `${this.target}.addModifier`,
      payload: this.modifier,
    });
  }
}
