export const shopDefaultState = {
  powerupDiscountRate: 0.75,
};

export default function shopReducer(state = shopDefaultState, action) {
  const { type, payload } = action;
  switch (type) {
    default:
      return state;
  }
}
