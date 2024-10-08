/* eslint-disable @typescript-eslint/no-loss-of-precision */
import {Dex, Generation, Generations, ID, PokemonSet, Specie, toID} from '@pkmn/data';

import * as aliases from './aliases.json';

export const PRECISION = 1e10;

export const enum Outcome {
  POKE1_KOED = 0,
  POKE2_KOED = 1,
  DOUBLE_DOWN = 2,
  POKE1_SWITCHED_OUT = 3,
  POKE2_SWITCHED_OUT = 4,
  DOUBLE_SWITCH = 5,
  POKE1_FORCED_OUT = 6,
  POKE2_FORCED_OUT = 7,
  POKE1_UTURN_KOED = 8,
  POKE2_UTURN_KOED = 9,
  POKE1_FODDERED = 10,
  POKE2_FODDERED = 11,
  UNKNOWN = 12
}

const ALIASES: Readonly<{[id: string]: string}> = aliases;

let DEFAULT!: Generation;
export function newGenerations(dex: Dex) {
  const gens = new Generations(dex, e => !!e.exists);
  DEFAULT = gens.get(9);
  return gens;
}

export function ignoreGen(gen: Generation, legacy: boolean) {
  if (!gen) throw new Error('ignoreGen called without a gen to ignore!');
  if (!legacy) return gen;
  if (!DEFAULT) throw new Error('Default generation not set - call newGenerations');
  return DEFAULT;
}

export function fromAlias(name: string) {
  return ALIASES[toID(name)] || name;
}

export function getSpecies(gen: Generation, name: string, legacy: boolean) {
  const species = ignoreGen(gen, legacy).species.get(name);
  if (!species) throw new Error(`Unknown species '${name}'`);
  return species;
}

export function getBaseSpecies(gen: Generation, name: string, legacy: boolean): Specie {
  const species = getSpecies(gen, name, legacy);
  return species.baseSpecies && species.baseSpecies !== species.name
    ? getBaseSpecies(gen, species.baseSpecies, legacy)
    : species;
}

export function genForFormat(gens: Generations, format: ID) {
  const m = /gen(\d)/.exec(format);
  return gens.get(m ? m[1] : 6);
}

export function isMega(species: Specie, legacy: boolean) {
  return species.forme && (species.forme.startsWith('Mega') || species.forme.startsWith('Primal') ||
    (!legacy && species.forme.startsWith('Ultra')));
}

export function getMegaEvolution(
  gen: Generation,
  pokemon: PokemonSet<string | ID>,
  legacy: boolean,
) {
  const item = ignoreGen(gen, legacy).items.get(pokemon.item);
  if (!item) return undefined;
  const species = getSpecies(gen, pokemon.species, legacy);
  if (item.name === 'Blue Orb' &&
    (species.name === 'Kyogre' || species.baseSpecies === 'Kyogre')) {
    return {species: 'kyogreprimal' as ID, ability: 'primordialsea' as ID};
  }
  if (item.name === 'Red Orb' &&
    (species.name === 'Groudon' || species.baseSpecies === 'Groudon')) {
    return {species: 'groudonprimal' as ID, ability: 'desolateland' as ID};
  }
  if (!legacy && item.name === 'Ultranecrozium Z' &&
    (species.name === 'Necrozma' || species.baseSpecies === 'Necrozma')) {
    return {species: 'necrozmaultra' as ID, ability: 'neuroforce' as ID};
  }
  if (!item.megaEvolves || item.megaEvolves !== species.name || !item.megaStone) {
    return undefined;
  }
  const mega = getSpecies(gen, item.megaStone, legacy);
  if (!mega) return undefined;
  return {species: toID(mega.name), ability: toID(mega.abilities['0'])};
}

export function revertFormes(gen: Generation, id: ID, legacy: boolean) {
  const species = getSpecies(gen, id, legacy);
  if (!species.forme || isMega(species, legacy)) return id;
  return getBaseSpecies(gen, species.id, legacy).id;
}

const NON_SINGLES_FORMATS_LEGACY = new Set([
  'battlespotdoubles',
  'battlespotspecial7',
  'battlespottriples',
  'gen5doublesou',
  'gen5smogondoubles',
  'gen7battlespotdoubles',
  'gen7doublesanythinggoes',
  'gen7doublesanythinggoesbeta',
  'gen7doublesou',
  'gen7doublesoubeta',
  'gen7pokebankdoublesag',
  'gen7pokebankdoublesanythinggoes',
  'gen7pokebankdoublesou',
  'gen7pokebankdoublesoubeta',
  'gen7randomdoublesbattle',
  'gen7vgc2017',
  'gen7vgc2017beta',
  'gen7vgc2018',
  'gen7vgc2019',
  'gen8doublesou',
  'gen8doublesubers',
  'gen8doublesuu',
  'gen8vgc2020',
  'gen8vgc2021',
  'gen8vgc2022',
  'orassmogondoubles',
  'randomdoublesbattle',
  'randomtriplesbattle',
  'smogondoubles',
  'smogondoublessuspecttest',
  'smogondoublesubers',
  'smogondoublesuu',
  'smogontriples',
  'vgc2014',
  'vgc2015',
  'vgc2016',
  'vgc2017',
]);

const NON_SINGLES_FORMATS = new Set([
  ...NON_SINGLES_FORMATS_LEGACY,
  // old
  'doublesou',
  'doublesubers',
  'doublesuu',
  'gen6vgc2016',
  'gen7vgc2019sunseries',
  'gen7vgc2019moonseries',
  'gen7vgc2019ultraseries',
  'gen8vgc2021series9',
  'gen8vgc2021series9limitonerestrictedrestrictedlegendary',
  // format.gameType !== 'singles' && !format.id.endsWith('customgame') && !format.team
  'gen3doublesou',
  'gen4doublesou',
  'gen4vgc2010',
  'gen5vgc2013',
  'gen6battlespotdoubles',
  'gen6battlespottriples',
  'gen6doublesou',
  'gen6vgc2015',
  'gen7doublesuu',
  'gen92v2doubles',
  'gen9doubleslc',
  'gen9doublesou',
  'gen9doublesubers',
  'gen9doublesuu',
  'gen9freeforall',
  'gen9nationaldexdoubles',
  'gen9triples',
  'gen9vgc2024regg',
  'gen9vgc2024reggbo3',
  'gen9vgc2024regh',
  'gen9vgc2024reghbo3',
]);

// Note: Generations doesn't have the concept of "format", so looking up a formats's `gameType` as
// one might expect to be able to do with a Dex doesn't work. Furthermore, formats are configurable
// and change over time -- many of these formats are no longer present in Pokémon Showdown's
// canonical config/formats.ts data
export function isNonSinglesFormat(format: ID, legacy: boolean) {
  if (format.endsWith('suspecttest')) format = format.slice(0, -11) as ID;
  return (legacy ? NON_SINGLES_FORMATS_LEGACY : NON_SINGLES_FORMATS).has(format);
}

const NON_6V6_FORMATS_LEGACY = new Set([
  'battlespotdoubles',
  'battlespotsingles',
  'battlespotspecial7',
  'challengecup1v1',
  'gen5gbusingles',
  'gen71v1',
  'gen7alolafriendly',
  'gen7battlespotdoubles',
  'gen7battlespotsingles',
  'gen7challengecup1v1',
  'gen7vgc2017',
  'gen7vgc2017beta',
  'gen81v1',
  'gen8firstblood',
  'gen8tagteamsingles',
  'gen91v1',
  'pgllittlecup',
  'vgc2014',
  'vgc2015',
  'vgc2016',
  'vgc2017',
]);

const NON_6V6_FORMATS = new Set([
  ...NON_6V6_FORMATS_LEGACY,
  // old
  '1v1',
  'gen5gbusingles',
  'gen6vgc2016',
  'gen7vgc2018',
  'gen7vgc2019',
  'gen7vgc2019moonseries',
  'gen7vgc2019sunseries',
  'gen7vgc2019ultraseries',
  'gen8firstblood',
  'gen8tagteamsingles',
  'gen8vgc2020',
  'gen8vgc2021',
  'gen8vgc2021series9',
  'gen8vgc2021series9limitonerestrictedrestrictedlegendary',
  'gen8vgc2022',
  // format.teamLength !== 'singles' && Dex.formats.getRuleTable(format).pickedTeamSize < 6
  'gen9bssregg',
  'gen9bssregh',
  'gen9vgc2024regg',
  'gen9vgc2024reggbo3',
  'gen9vgc2024regh',
  'gen9vgc2024reghbo3',
  'gen92v2doubles',
  'gen9bssfactory',
  'gen9challengecup1v1',
  'gen9challengecup2v2',
  'gen8bssfactory',
  'gen8cap1v1',
  'gen7bssfactory',
  'gen8battlestadiumsingles',
  'gen61v1',
  'gen6battlespotsingles',
  'gen6vgc2015',
  'gen6battlespotdoubles',
  'gen51v1',
  'gen5vgc2013',
  'gen41v1',
  'gen31v1',
  'gen21v1',
  'gen11v1',
]);

// See comment above regarding why we can't just rely on a format's `pickedTeamSize` to compute this
export function isNon6v6Format(format: ID, legacy: boolean) {
  if (format.endsWith('suspecttest')) format = format.slice(0, -11) as ID;
  return (legacy ? NON_6V6_FORMATS_LEGACY : NON_6V6_FORMATS).has(format);
}

export function canonicalizeFormat(format: ID) {
  if (format.endsWith('current')) format = format.slice(0, -7) as ID;
  if (format.startsWith('pokebank')) format = format.slice(8, -4) as ID;
  if (format.startsWith('oras')) format = format.slice(4) as ID;
  if (format === 'capbeta') return 'cap' as ID;
  if (format === 'vgc2014beta') return 'vgc2014' as ID;
  if (format.startsWith('xybattlespot') && format.endsWith('beta')) {
    format = format.slice(0, -4) as ID;
  }
  if (['battlespotdoubles', 'battlespotdoublesvgc2015'].includes(format)) return 'vgc2015' as ID;
  if (format === 'smogondoubles') return 'doublesou' as ID;
  if (format === 'smogondoublesubers') return 'doublesubers' as ID;
  if (format === 'smogondoublesuu') return 'doublesuu' as ID;
  return format;
}

export function round(v: number, p = PRECISION) {
  return Math.round(v * p) / p;
}

export function roundStr(v: number, p = PRECISION) {
  const num = round(v, p);
  return num === Math.floor(num) ? `${num.toFixed(1)}` : `${num}`;
}

export function displaySpecies(gen: Generation, name: string, legacy: boolean) {
  if (name === 'empty') {
    if (!legacy) throw new Error('empty passed to displaySpecies');
    return name;
  }
  const species = getSpecies(gen, name, legacy).name;
  if (name === 'Flabébé') return 'Flabebe';
  return legacy && species.startsWith('Nidoran') ? species.replace('-', '') : species;
}

export function toDisplayObject(
  map: {[k: string /* number|ID */]: number},
  display?: (id: string) => string,
  p = PRECISION
) {
  const obj: {[key: string]: number} = {};
  const d = (k: number | string) => (typeof k === 'string' && display ? display(k) : k.toString());
  const sorted = Object.entries(map).sort((a, b) => b[1] - a[1] || d(a[0]).localeCompare(d(b[0])));
  for (const [k, v] of sorted) {
    // FIXME: use display here for `chaos` reports as well
    obj[k.toString()] = round(v, p);
  }
  return obj;
}

export function computeViability(gxes: number[]): [number, number, number, number] {
  if (!gxes.length) return [0, 0, 0, 0];

  gxes.sort((a, b) => b - a);
  return [
    gxes.length,
    gxes[0],
    gxes[Math.ceil(0.01 * gxes.length) - 1],
    gxes[Math.ceil(0.2 * gxes.length) - 1],
  ];
}

export interface EncounterStatistics {
  koed: number;
  switched: number;
  n: number;
  p: number;
  d: number;
  score: number;
}

export function getChecksAndCounters<T>(
  encounters: {[id: string /* ID */]: number /* Outcome */[]},
  display: [(id: string) => string, (es: EncounterStatistics) => T],
  min = 20
) {
  const cc: Array<[string, EncounterStatistics]> = [];
  for (const [id, outcomes] of Object.entries(encounters)) {
    // Outcome.POKE1_KOED...Outcome.DOUBLE_SWITCH
    const n = outcomes.slice(0, 6).reduce((a, b) => a + b);
    if (n <= min) continue;

    const koed = outcomes[Outcome.POKE1_KOED];
    const switched = outcomes[Outcome.POKE1_SWITCHED_OUT];
    const p = round((koed + switched) / n);
    const d = round(Math.sqrt((p * (1.0 - p)) / n));
    const score = round(p - 4 * d);
    cc.push([id, {koed, switched, n, p, d, score}]);
  }

  const sorted = cc.sort((a, b) => b[1].score - a[1].score || a[0].localeCompare(b[0]));
  const obj: {[key: string]: T} = {};
  for (const [k, v] of sorted) {
    obj[display[0](k)] = display[1](v);
  }
  return obj;
}

export function stallinessHistogram(stalliness: Array<[number, number]>) {
  stalliness.sort((a, b) => a[0] - b[0] || a[1] - b[1]);

  // Figure out a good bin range by looking at .1% and 99.9% points
  const index = Math.floor(stalliness.length / 1000);
  let low = stalliness[index][0];
  let high = stalliness[stalliness.length - index - 1][0];
  if (low > 0) {
    low = 0;
  } else if (high < 0) {
    high = 0;
  }

  // Rough guess at number of bins - possible the minimum?
  let nbins = 13;
  const size = (high - low) / (nbins - 1);
  // Try to find a prettier bin size, zooming into 0.05 at most.
  const binSize = [10, 5, 2.5, 2, 1.5, 1, 0.5, 0.25, 0.2, 0.1, 0.05].find(bs => size > bs) || 0.05;
  let histogram = [[0, 0]];
  for (let x = binSize; x + binSize / 2 < high; x += binSize) {
    histogram.push([x, 0]);
  }
  for (let x = -binSize; x - binSize / 2 > low; x -= binSize) {
    histogram.push([x, 0]);
  }
  histogram = histogram.sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  nbins = histogram.length;

  const start = 0;
  // FIXME: Python comparison of an array and a number = break immediately
  // for (; start < stalliness.length; start++) {
  //   if (stalliness[start] >= histogram[0][0] - binSize / 2) break;
  // }
  let j = 0;
  for (let i = start; i < stalliness.length; i++) {
    while (stalliness[i][0] > histogram[0][0] + binSize * (j + 0.5)) j++;
    if (j >= nbins) break;
    histogram[j][1] = histogram[j][1] + stalliness[i][1];
  }

  let x = 0;
  let total = 0;
  for (const [val, weight] of stalliness) {
    x += val * weight;
    total += weight;
  }
  const mean = x / total;

  return {histogram, binSize, mean, total};
}

export function victoryChance(r1: number, d1: number, r2: number, d2: number) {
  const C = (3.0 * Math.pow(Math.log(10.0), 2.0)) / Math.pow(400.0 * Math.PI, 2);
  const d = Math.pow(d1, 2.0) + Math.pow(d2, 2.0);
  return 1.0 / (1.0 + Math.pow(10.0, (r2 - r1) / 400.0 / Math.sqrt(1.0 + C * d)));
}

export function weighting(rating: number, deviation: number, cutoff: number) {
  if (deviation > 100 && cutoff > 1500) return 0;
  return (erf((rating - cutoff) / deviation / Math.sqrt(2.0)) + 1.0) / 2.0;
}

const MAX_NUM = Math.pow(2, 53);
const THRESH = 0.46875;
const SQRPI = 5.6418958354775628695e-1;
const P = [
  [
    3.1611237438705656, 1.13864154151050156e2, 3.77485237685302021e2,
    3.20937758913846947e3, 1.85777706184603153e-1,
  ],
  [
    5.64188496988670089e-1, 8.88314979438837594, 6.61191906371416295e1,
    2.98635138197400131e2, 8.8195222124176909e2, 1.71204761263407058e3,
    2.05107837782607147e3, 1.23033935479799725e3, 2.15311535474403846e-8,
  ],
  [
    3.05326634961232344e-1, 3.60344899949804439e-1, 1.25781726111229246e-1,
    1.60837851487422766e-2, 6.58749161529837803e-4, 1.63153871373020978e-2,
  ],
];
const Q = [
  [
    2.36012909523441209e1, 2.44024637934444173e2, 1.28261652607737228e3,
    2.84423683343917062e3,
  ],
  [
    1.57449261107098347e1, 1.17693950891312499e2, 5.37181101862009858e2,
    1.62138957456669019e3, 3.29079923573345963e3, 4.36261909014324716e3,
    3.43936767414372164e3, 1.23033935480374942e3,
  ],
  [
    2.56852019228982242, 1.87295284992346047, 5.27905102951428412e-1,
    6.05183413124413191e-2, 2.33520497626869185e-3,
  ],
];

// Compute the erf function of a value using a rational Chebyshev approximations for
// different intervals of x.
//
// This is a translation of W. J. Cody's Fortran implementation from 1987
// (https://www.netlib.org/specfun/erf). See the AMS publication "Rational Chebyshev
// Approximations for the Error Function" by W. J. Cody for an explanation of this process.
function erf(x: number) {
  const y = Math.abs(x);
  if (y >= MAX_NUM) return Math.sign(x);
  if (y <= THRESH) return Math.sign(x) * erf1(y);
  if (y <= 4.0) return Math.sign(x) * (1 - erfc2(y));
  return Math.sign(x) * (1 - erfc3(y));
}

// Approximates the error function erf() for x <= 0.46875 using this function:
//               n
// erf(x) = x * sum (p_j * x^(2j)) / (q_j * x^(2j))
//              j=0
function erf1(y: number) {
  const ysq = y * y;
  let xnum = P[0][4] * ysq;
  let xden = ysq;

  for (let i = 0; i < 3; i += 1) {
    xnum = (xnum + P[0][i]) * ysq;
    xden = (xden + Q[0][i]) * ysq;
  }

  return (y * (xnum + P[0][3])) / (xden + Q[0][3]);
}

// Approximates the complement of the error function erfc() for 0.46875 <= x <= 4.0
// using this function:
//                       n
// erfc(x) = e^(-x^2) * sum (p_j * x^j) / (q_j * x^j)
//                      j=0
function erfc2(y: number) {
  let xnum = P[1][8] * y;
  let xden = y;

  for (let i = 0; i < 7; i += 1) {
    xnum = (xnum + P[1][i]) * y;
    xden = (xden + Q[1][i]) * y;
  }

  const result = (xnum + P[1][7]) / (xden + Q[1][7]);
  const ysq = Math.floor(y * 16) / 16;
  const del = (y - ysq) * (y + ysq);
  return Math.exp(-ysq * ysq) * Math.exp(-del) * result;
}

// Approximates the complement of the error function erfc() for x > 4.0 using this function:
//
// erfc(x) = (e^(-x^2) / x) * [ 1/sqrt(pi) +
//               n
//    1/(x^2) * sum (p_j * x^(-2j)) / (q_j * x^(-2j)) ]
//              j=0
function erfc3(y: number) {
  let ysq = 1 / (y * y);
  let xnum = P[2][5] * ysq;
  let xden = ysq;

  for (let i = 0; i < 4; i += 1) {
    xnum = (xnum + P[2][i]) * ysq;
    xden = (xden + Q[2][i]) * ysq;
  }

  let result = (ysq * (xnum + P[2][4])) / (xden + Q[2][4]);
  result = (SQRPI - result) / y;
  ysq = Math.floor(y * 16) / 16;
  const del = (y - ysq) * (y + ysq);
  return Math.exp(-ysq * ysq) * Math.exp(-del) * result;
}
