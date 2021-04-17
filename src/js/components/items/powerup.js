import store from "../../store";

export class Powerup {
  constructor({
    name,
    target,
    texture = "powerups",
    frame = 0,
    modifier,
    duration,
  }) {
    if (modifier.key === undefined) modifier.key = "Powerup:" + name;
    this.name = name;
    this.target = target;
    this.texture = texture;
    this.frame = frame;
    this.modifier = modifier;
    this.duration = duration * 1000;
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
    store.dispatch({
      type: `${this.target}.addModifier`,
      payload: this.modifier,
    });
  }
}
