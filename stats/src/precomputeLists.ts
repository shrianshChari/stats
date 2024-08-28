import { Dex, GenerationNum, ID, Move } from "@pkmn/dex";

function doesntTargetFoes(move: Move) {
  return !['normal', 'adjacentFoe', 'allAdjacentFoes', 'foeSide'].includes(move.target);
}

export function produceDragons(gen: GenerationNum) {
  return new Set(Dex.forGen(gen).species.all()
    .filter((specie) => specie.gen <= gen && specie.types.includes('Dragon'))
    .map((specie) => specie.id));
}

export function produceGreatSetupMoves(gen: GenerationNum) {
  const ALL_MOVES = Dex.forGen(gen).moves.all();
  // Logic for this set of moves is taken from https://pokemetrics.wordpress.com/2012/09/13/revisions-revisions/
  return new Set([
    // Moves that either boost an attacking stat by multiple stages
    // or boosts Speed and an attacking stat
    ...ALL_MOVES
      .filter((move) => move.boosts && doesntTargetFoes(move) &&
        (
          (move.boosts.atk && ((move.boosts.atk >= 1 && move.boosts.spe && move.boosts.spe >= 1) || move.boosts.atk >= 2)) ||
          (move.boosts.spa && ((move.boosts.spa >= 1 && move.boosts.spe && move.boosts.spe >= 1) || move.boosts.spa >= 2))
        )).map((move) => move.id),
  // For some reason, Tidy Up doesn't fit under the above category
    ...(gen >= 9 ? ['tidyup'] : []),
    // Attacking moves that have a high Base Power (80 or above)
    // and have a high likelihood of boosting (at least 50%)
    ...ALL_MOVES
      .filter((move) => move.basePower >= 80 && move.secondary?.self?.boosts
        && move.secondary?.chance && move.secondary?.chance >= 50)
      .map((move) => move.id),
    // These two moves in particular
    ...(gen >= 2 ? ['curse', 'growth'] as ID[] : []),
  ]);
}

export function produceLesserSetupMoves(gen: GenerationNum) {
  const ALL_MOVES = Dex.forGen(gen).moves.all().filter((move) => move.gen <= gen);
  return new Set([
    // Moves that only boost attacking stats by one stage
    ...ALL_MOVES.filter((move) => move.boosts &&
      (
        (move.boosts.atk && move.boosts.atk == 1) ||
        (move.boosts.spa && move.boosts.spa == 1)
      )
      && !move.boosts.spe && move.target !== 'normal' && move.id !== 'growth'
    ).map((move) => move.id),
    // Weaker attacking moves that boost stats
    ...ALL_MOVES.filter((move) => move.basePower > 0 && move.basePower < 80 &&
      move.secondary?.self?.boosts && move.secondary?.chance && move.secondary?.chance >= 50
    ).map((move) => move.id),
    // Moves that only boost speed
    ...ALL_MOVES.filter((move) => doesntTargetFoes(move) &&
      move.boosts && move.boosts.spe && !move.boosts.atk && !move.boosts.spa).map((move) => move.id),
    // Moves that boost evasion
    ...ALL_MOVES.filter((move) => !['normal', 'adjacentFoe', 'allAdjacentFoes', 'foeSide'].includes(move.target) && move.boosts && move.boosts.evasion).map((move) => move.id),
    // These moves in particular
    ...(gen >= 6 ? ['rototiller'] : []),
    ...(gen >= 4 ? ['acupressure', 'tailwind'] as ID[] : []),
  ]);
}

export function produceBatonPassableMoves(gen: GenerationNum) {
  const ALL_MOVES = Dex.forGen(gen).moves.all().filter((move) => move.gen <= gen);

  return new Set([
    // Any move that boosts your own stats
    ...ALL_MOVES.filter((move) => move.boosts && (move.target === 'self' || move.target === 'adjacentAllyOrSelf' || move.target === 'allies')).map((move) => move.id),
    // Any attacking move that can increase your own stats
    ...ALL_MOVES
      .filter((move) => move.basePower > 0 && move.secondary?.self?.boosts && move.secondary?.chance && move.secondary?.chance >= 50)
      .map((move) => move.id),
    // Other moves that have effects that can be Baton Passed
    ...(gen >= 4 ? ['acupressure'] as ID[] : []),
    ...(gen >= 3 ? ['charge', 'ingrain', 'stockpile']  as ID[] : []),
    ...(gen >= 2 ? ['curse'] as ID[] : []),
    'substitute' as ID,
  ]);
}

export function produceGravityBenefittingMoves(gen: GenerationNum) {
  const ALL_MOVES = Dex.forGen(gen).moves.all().filter((move) => move.gen <= gen);

  return new Set([
    // Moves that have 80% accuracy or worse
    ...ALL_MOVES
      .filter((move) => (move.target === 'normal' || move.target === 'allAdjacentFoes' || move.target === 'any') && move.accuracy !== true && move.accuracy > 0 && move.accuracy <= 80)
      .map((move) => move.id),
    // Ground-type moves
    ...ALL_MOVES.filter((move) => move.type === 'Ground' && move.id !== 'hiddenpower' && move.target !== 'all').map((move) => move.id),
    // Grounded hazards
    ...(gen >= 6 ? ['stickyweb'] as ID[] : []),
    ...(gen >= 4 ? ['toxicspikes'] as ID[] : []),
    ...(gen >= 2 ? ['spikes'] as ID[] : []),
  ]);
}
