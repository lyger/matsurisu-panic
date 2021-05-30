function applyAirBonus(airborne, state) {
  if (!airborne) return state;
  const airCounter = state.airCounter + (state.airForgiveness > 0 ? 1 : 0);
  const airBonus = airCounter * state.bonusPerAir;
  return {
    ...state,
    airCounter: airCounter + 1,
    airForgiveness: 0,
    score: state.score + airBonus,
  };
}

export const scoreDefaultState = {
  stagesCleared: 0,
  score: 0,
  lives: 3,
  money: 0,
  maxLives: 10,
  maxMoney: 99999,
  combo: 0,
  bestCombo: 0,
  drops: 0,
  moneyPerCoin: 500,
  scorePerCatch: 100,
  scorePerEbifrion: 2000,
  scorePerRedundantPowerup: 500,
  bonusPerCombo: 5,
  lowMultiplier: 2,
  airCounter: 0,
  airForgiveness: 0,
  bonusPerAir: 250,
  minCombo: 5,
  maxCombo: 25,
  scorePerFullCombo: 3000,
  fever: 0,
  invincible: false,
  results: {
    livesMultiplier: 1500,
    stagesMultiplier: 1000,
    moneyMultiplier: 0.2,
    bestComboMultiplier: 200,
  },
};

export default function scoreReducer(state = scoreDefaultState, action) {
  const { type, payload } = action;
  switch (type) {
    case "score.catchMatsurisu": {
      const newCombo = state.combo + 1;
      const comboBonus =
        Math.max(Math.min(newCombo, state.maxCombo) - state.minCombo, 0) *
        state.bonusPerCombo;
      const multiplier = payload.isLow ? state.lowMultiplier : 1;
      const stateWithAir = applyAirBonus(payload.airborne, state);
      return {
        ...stateWithAir,
        combo: newCombo,
        bestCombo: Math.max(newCombo, state.bestCombo),
        score:
          stateWithAir.score + (state.scorePerCatch + comboBonus) * multiplier,
        fever: state.fever + (payload.isFever ? 1 : 0),
      };
    }
    case "score.catchCoin": {
      const stateWithAir = applyAirBonus(payload.airborne, state);
      const multiplier = payload.isLucky ? 2 : 1;
      return {
        ...stateWithAir,
        money: Math.min(
          state.money + multiplier * state.moneyPerCoin,
          state.maxMoney
        ),
        fever: state.fever + (payload.isFever ? 1 : 0),
      };
    }
    case "score.catchPowerup": {
      const stateWithAir = applyAirBonus(payload.airborne, state);
      const stateWithRedundant = payload.isRedundant
        ? {
            ...stateWithAir,
            score: stateWithAir.score + stateWithAir.scorePerRedundantPowerup,
          }
        : stateWithAir;
      if (payload.isFever)
        return { ...stateWithRedundant, fever: state.fever + 1 };
      return stateWithRedundant;
    }
    case "score.catchEbifrion": {
      const stateWithAir = applyAirBonus(payload.airborne, state);
      return {
        ...stateWithAir,
        score: stateWithAir.score + state.scorePerEbifrion,
      };
    }
    case "score.catchEquipment": {
      const stateWithAir = applyAirBonus(payload.airborne, state);
      return stateWithAir;
    }
    case "score.dropMatsurisu":
      if (state.invincible || payload.bonus) return state;
      return {
        ...state,
        combo: 0,
        drops: state.drops + 1,
        lives: Math.max(state.lives - 1, 0),
      };
    case "score.buyEbifrion": {
      return {
        ...state,
        score: state.score + state.scorePerEbifrion,
      };
    }
    case "score.addScore":
      // Should only be used in the rare case when score needs to be manually adjusted, otherwise use "score.catchMatsurisu"
      return {
        ...state,
        score: state.score + payload,
      };
    case "score.loseLife":
      // Should only be used in the rare case when lives need to be manually adjusted, otherwise use "score.dropMatsurisu"
      return {
        ...state,
        lives: Math.max(state.lives - (payload || 1), 0),
      };
    case "score.gainLife":
      return {
        ...state,
        lives: Math.min(state.lives + (payload || 1), state.maxLives),
      };
    case "score.loseMoney":
      return {
        ...state,
        money: Math.max(state.money - payload, 0),
      };
    case "score.gainMoney":
      // Should only be used in the rare case when money needs to be manually adjusted, otherwise use "score.catchCoin"
      return {
        ...state,
        money: Math.min(state.money + payload, state.maxMoney),
      };
    case "score.resetAir":
      return {
        ...state,
        airCounter: 0,
        airForgiveness: 0,
      };
    case "score.addFever":
      return {
        ...state,
        fever: state.fever + 1,
      };
    case "score.resetFever":
      return {
        ...state,
        fever: 0,
      };
    case "score.fullCombo":
      return {
        ...state,
        score: state.score + state.scorePerFullCombo,
      };
    case "score.addAirForgiveness":
      return {
        ...state,
        airForgiveness: state.airForgiveness + 1,
      };
    case "score.removeAirForgiveness":
      return {
        ...state,
        airForgiveness: Math.max(state.airForgiveness - 1, 0),
      };
    case "global.winStage":
      return {
        ...state,
        stagesCleared: state.stagesCleared + 1,
        combo: 0,
        drops: 0,
        airCounter: 0,
        airForgiveness: 0,
        fever: 0,
      };
    case "global.winStageEndless":
      return {
        ...state,
        stagesCleared: state.stagesCleared + 1,
      };
    case "global.activateFever":
      return {
        ...state,
        invincible: true,
      };
    case "global.deactivateFever":
    case "global.winStage":
      return {
        ...state,
        invincible: false,
      };
    case "global.activateEndless":
      return {
        ...state,
        lives: state.maxLives,
      };
    case "global.deactivateEndless":
      return {
        ...state,
        lives: 3,
      };
    default:
      return state;
  }
}
