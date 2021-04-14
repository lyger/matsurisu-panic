const playerPhysicsDefaultState = {
  maxVelocity: 500,
  acceleration: 1500,
  gravity: 1200,
  drag: 1500,
  jumpAcceleration: 500,
  jumpVelocity: 500,
  hitBoxWidth: 150,
  hitBoxHeight: 20,
};

export const playerDefaultState = {
  skin: "placeholder",
  physics: playerPhysicsDefaultState,
};

function playerPhysicsReducer(state = playerPhysicsDefaultState, action) {
  const { type, payload } = action;

  switch (type) {
    case "player.physics.setMaxVelocity":
      return {
        ...state,
        maxVelocity: payload,
      };
    case "player.physics.setAcceleration":
      return {
        ...state,
        acceleration: payload,
      };
    case "player.physics.setDrag":
      return {
        ...state,
        drag: payload,
      };
    case "player.physics.setHitBoxWidth":
      return {
        ...state,
        hitBoxWidth: payload,
      };
    case "player.physics.setHitBoxHeight":
      return {
        ...state,
        hitBoxHeight: payload,
      };
    default:
      return state;
  }
}

export default function playerReducer(state = playerDefaultState, action) {
  return {
    ...state,
    physics: playerPhysicsReducer(state.physics, action),
  };
}
