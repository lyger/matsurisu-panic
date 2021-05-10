import store from "../../store";
import Item from "./item";

export default class Powerup extends Item {
  constructor({
    name,
    description,
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
      description,
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
    return this.conflictsWith.some((other) => "Powerup:" + other === key);
  }

  apply(scene) {
    const oldState = this.getTarget(store.getState());

    if (oldState.modifiers.some((mod) => this.checkConflicts(mod.key)))
      return false;

    store.dispatch({
      type: `${this.target}.addModifier`,
      payload: this.modifier,
    });

    const newState = this.getTarget(store.getState());

    if (
      newState.modifiers.length === oldState.modifiers.length ||
      !newState.modifiers.some((mod) => mod.key === this.modifier.key)
    )
      return false;

    scene.events.on("stage.clearEffects", () =>
      store.dispatch({
        type: `${this.target}.removeModifier`,
        payload: this.modifier.key,
      })
    );

    scene.events.emit("stage.addEffect", this);
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
