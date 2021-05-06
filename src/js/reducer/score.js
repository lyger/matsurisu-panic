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

const feverDefaultState = {
  gauge: 0,
  buffer: 0,
  maxBuffer: 10,
  perMatsurisuCatch: 1,
  perMatsurisuDrop: 10,
  perOtherCatch: 2,
  perOtherDrop: 5,
};

export const scoreDefaultState = {
  stagesCleared: 0,
  score: 0,
  lives: 3,
  money: 0,
  maxLives: 10,
  maxMoney: 99999,
  combo: 0,
  bestCombo: 0,
  moneyPerCoin: 500,
  scorePerCatch: 100,
  scorePerEbifrion: 2000,
  bonusPerCombo: 5,
  lowMultiplier: 2,
  airCounter: 0,
  airForgiveness: 0,
  bonusPerAir: 250,
  minCombo: 5,
  maxCombo: 25,
  scorePerFullCombo: 3000,
  fever: feverDefaultState,
  results: {
    livesMultiplier: 1500,
    moneyMultiplier: 0.2,
    bestComboMultiplier: 200,
  },
};

function applyBonusToFever(state, bonus) {
  if (state.buffer === state.maxBuffer) {
    return {
      ...state,
      gauge: state.gauge + bonus,
    };
  }
  const newBuffer = state.buffer + bonus;
  return {
    ...state,
    gauge: state.gauge + Math.max(newBuffer - state.maxBuffer, 0),
    buffer: Math.min(newBuffer, state.maxBuffer),
  };
}

function applyPenaltyToFever(state, penalty) {
  if (state.buffer === 0)
    return {
      ...state,
      gauge: Math.max(state.gauge - penalty, 0),
    };
  if (state.buffer < penalty)
    return {
      ...state,
      gauge: Math.max(state.gauge + state.buffer - penalty, 0),
      buffer: 0,
    };
  return {
    ...state,
    buffer: 0,
  };
}

function feverReducer(state = feverDefaultState, action) {
  const { type, payload } = action;
  switch (type) {
    case "fever.catchMatsurisu":
      return applyBonusToFever(state, state.perMatsurisuCatch);
    case "fever.dropMatsurisu":
      return applyPenaltyToFever(state, state.perMatsurisuDrop);
    case "fever.catchOther":
      return applyBonusToFever(state, state.perOtherCatch);
    case "fever.dropOther":
      return applyPenaltyToFever(state, state.perOtherDrop);
    case "fever.reset":
      return {
        ...state,
        gauge: 0,
        buffer: 0,
      };
    default:
      return state;
  }
}

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
        fever: feverReducer(state.fever, { type: "fever.catchMatsurisu" }),
      };
    }
    case "score.catchCoin": {
      const stateWithAir = applyAirBonus(payload.airborne, state);
      return {
        ...stateWithAir,
        money: Math.min(state.money + state.moneyPerCoin, state.maxMoney),
        fever: feverReducer(state.fever, { type: "fever.catchOther" }),
      };
    }
    case "score.catchPowerup": {
      const stateWithAir = applyAirBonus(payload.airborne, state);
      return {
        ...stateWithAir,
        fever: feverReducer(state.fever, { type: "fever.catchOther" }),
      };
    }
    case "score.catchEbifrion": {
      const stateWithAir = applyAirBonus(payload.airborne, state);
      return {
        ...stateWithAir,
        score: stateWithAir.score + state.scorePerEbifrion,
        fever: feverReducer(state.fever, { type: "fever.catchOther" }),
      };
    }
    case "score.dropMatsurisu":
      return {
        ...state,
        combo: 0,
        lives: Math.max(state.lives - 1, 0),
        fever: feverReducer(state.fever, { type: "fever.dropMatsurisu" }),
      };
    case "score.dropCoin":
    case "score.dropPowerup":
    case "score.dropEbifrion":
      return {
        ...state,
        fever: feverReducer(state.fever, { type: "fever.dropOther" }),
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
        money: Math.max(state.money - (payload || 1), 0),
      };
    case "score.gainMoney":
      // Should only be used in the rare case when money needs to be manually adjusted, otherwise use "score.catchCoin"
      return {
        ...state,
        money: Math.min(state.money + (payload | 1), state.maxMoney),
      };
    case "score.resetAir":
      return {
        ...state,
        airCounter: 0,
        airForgiveness: 0,
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
    case "score.winStage":
      return {
        ...state,
        stagesCleared: state.stagesCleared + 1,
        combo: 0,
        fever: feverReducer(state.fever, { type: "fever.reset" }),
      };
    default:
      return state;
  }
}
