export function applyModifiersToState(state) {
  const modState = { ...state };
  state.modifiers.forEach((modifier) => {
    for (const prop in modifier) {
      if (prop !== "modifiers" && prop !== "op" && prop in modState)
        switch (modifier.op) {
          case "multiply":
            modState[prop] *= modifier[prop];
            break;
          case "add":
          default:
            modState[prop] += modifier[prop];
        }
    }
  });
  return modState;
}

export function addModifierWithoutDuplicates(state, modifier) {
  const isDuplicate = state.modifiers.reduce(
    (acc, existingModifier) => acc || existingModifier.key == modifier.key,
    false
  );
  if (isDuplicate) return state;
  return {
    ...state,
    modifiers: state.modifiers.concat([modifier]),
  };
}

export function chooseFromArray(arr, num) {
  const buffer = arr.slice();
  if (num >= arr.length) return buffer;
  const ret = [];
  for (let i = 0; i < num; i++) {
    const idx = Math.floor(Math.random() * buffer.length);
    ret.push(...buffer.splice(idx, 1));
  }
  return ret;
}
