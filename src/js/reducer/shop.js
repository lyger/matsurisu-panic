export const shopDefaultState = {
  numItems: 4,
};

export default function shopReducer(state = shopDefaultState, action) {
  const { type, payload } = action;
  switch (type) {
    default:
      return state;
  }
}
