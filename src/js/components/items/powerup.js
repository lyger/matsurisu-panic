import store from "../../store";
import { traverseState } from "../../utils";
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
    purchaseSound,
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
      purchaseSound,
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

  checkConflicts(key) {
    return this.conflictsWith.some((other) => "Powerup:" + other === key);
  }

  apply(scene) {
    const oldState = traverseState(store.getState(), this.target);

    if (oldState.modifiers.some((mod) => this.checkConflicts(mod.key)))
      return false;

    store.dispatch({
      type: `${this.target}.addModifier`,
      payload: this.modifier,
    });

    const newState = traverseState(store.getState(), this.target);

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
