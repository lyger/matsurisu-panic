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
