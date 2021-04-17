import { addModifierWithoutDuplicates } from "../utils";

const playerPhysicsDefaultState = {
  maxVelocity: 500,
  acceleration: 1500,
  gravity: 1200,
  drag: 1500,
  jumpAcceleration: 500,
  jumpVelocity: 500,
  hitBoxWidth: 150,
  hitBoxHeight: 25,
  modifiers: [],
};

export const playerDefaultState = {
  skin: "normal",
  powerup: null,
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
    case "player.physics.addModifier":
      return addModifierWithoutDuplicates(state, payload);
    case "player.physics.removeModifier":
      return {
        ...state,
        modifiers: state.modifiers.filter(
          (modifier) => modifier.key !== payload
        ),
      };
    default:
      return state;
  }
}

export default function playerReducer(state = playerDefaultState, action) {
  const { type, payload } = action;

  switch (type) {
    case "player.setPowerup":
      return {
        ...state,
        powerup: payload,
      };
    case "player.clearPowerup":
      return {
        ...state,
        powerup: null,
      };
    default:
      return {
        ...state,
        physics: playerPhysicsReducer(state.physics, action),
      };
  }
}
