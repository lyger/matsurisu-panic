import store from "../../store";
import Item from "./item";

export default class Powerup extends Item {
  constructor({
    name,
    tier,
    texture,
    frame = 0,
    sound,
    target,
    modifier,
    duration,
    price,
    purchaseLimit,
    purchaseConditions,
    buySideEffect,
    applySideEffect,
    conflictsWith,
  }) {
    super("powerup", {
      name,
      tier,
      texture,
      frame,
      price,
      purchaseLimit,
      purchaseConditions,
      buySideEffect,
    });
    if (modifier.key === undefined) modifier.key = "Powerup:" + name;
    this.sound = sound;
    this.target = target;
    this.modifier = modifier;
    this.duration = duration * 1000;
    this.applySideEffect = applySideEffect;
    this.conflictsWith =
      conflictsWith === undefined || conflictsWith === null
        ? []
        : conflictsWith;
  }

  handleBuy() {
    store.dispatch({ type: "player.setPowerup", payload: this });
  }

  getTarget(state) {
    return this.target.split(".").reduce((st, key) => st[key], state);
  }

  checkConflicts(key) {
    return this.conflictsWith.reduce(
      (acc, other) => acc || key === "Powerup:" + other,
      false
    );
  }

  apply(scene) {
    const oldState = this.getTarget(store.getState());

    if (
      oldState.modifiers.reduce(
        (acc, mod) =>
          acc || mod.key === this.modifier.key || this.checkConflicts(mod.key),
        false
      )
    )
      return false;

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

    const newState = this.getTarget(store.getState());
    const applied = newState.modifiers.reduce(
      (acc, mod) => acc || mod.key === this.modifier.key,
      false
    );

    if (!applied) return false;

    scene.events.emit("stage.addEffect", {
      texture: this.texture,
      frame: this.frame,
      sound: this.sound,
      duration: this.duration,
    });
    scene.time.delayedCall(this.duration, () =>
      store.dispatch({
        type: `${this.target}.removeModifier`,
        payload: this.modifier.key,
      })
    );

    this.applySideEffect?.(scene);

    return true;
  }
}
