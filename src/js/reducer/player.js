import { addModifierWithoutDuplicates } from "../utils";

const playerPhysicsDefaultState = {
  maxVelocity: 500,
  acceleration: 1500,
  gravity: 1200,
  drag: 1500,
  jumpAcceleration: 450,
  jumpVelocity: 450,
  quickFallAcceleration: 1000,
  hitBoxWidth: 130,
  hitBoxHeight: 25,
  crouchMultiplier: 0.4,
  crouchHitBoxWidth: 100,
  crouchHitBoxHeight: 25,
  slideMultiplier: 1.4,
  slideThreshold: 0.8,
  slideCooldown: 500,
  airForgivenessDuration: 100,
  modifiers: [],
};

export const playerDefaultState = {
  skin: "normal",
  powerup: null,
  equipment: [],
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
    case "player.addEquipment":
      if (state.equipment.some(({ key }) => key === payload.key)) return state;
      return {
        ...state,
        equipment: state.equipment.concat([payload]),
      };
    default:
      return {
        ...state,
        physics: playerPhysicsReducer(state.physics, action),
      };
  }
}
