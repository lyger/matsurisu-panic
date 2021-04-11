const playerPhysicsDefaultState = {
  maxVelocity: 500,
  acceleration: 1500,
  drag: 1500,
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
