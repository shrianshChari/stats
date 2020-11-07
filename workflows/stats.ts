import * as path from 'path';

import {Dex} from '@pkmn/dex';
import {Generations, Generation} from '@pkmn/data';

import { canonicalizeFormat, Parser, Reports, Stats, TaggedStatistics } from '@pkmn/stats';

import {
  Batch,
  Checkpoints,
  fs,
  register,
  ID,
  Options,
  toID,
  CombineWorker,
  JSONCheckpoint,
  LogStorage,
  WorkerConfiguration,
} from '@pkmn/logs';

interface Configuration extends WorkerConfiguration {
  formats?: Set<ID>;
  legacy?: string;
  all?: boolean;
}

interface ApplyState {
  gen: Generation;
  format: ID,
  stats: TaggedStatistics;
  cutoffs: number[];
}

interface CombineState {

}

const GENS = new Generations(Dex, e => !!e.exists);
const forFormat = (format: ID) =>
  format.startsWith('gen') ? GENS.get(Number(format.charAt(3)) as Generation['num']) : GENS.get(6);
const MONOTYPES = new Set(Array.from(GENS.get(8).types).map(type => `mono${type.id}` as ID));

const SKIP = [
  'seasonal', 'random', 'petmod', 'factory', 'challengecup',
  'hackmonscup', 'digimon', 'metronome', 'superstaff',
];

const POPULAR = new Set([
  'ou', 'doublesou', 'randombattle', 'gen7pokebankou', 'gen7ou',
  'gen7pokebankdoublesou', 'gen8ou', 'gen8doublesou', 'gen8randombattle',
] as ID[]);

const CUTOFFS = {
  default: [0, 1500, 1630, 1760],
  popular: [0, 1500, 1695, 1825],
};

const StatsWorker = new class extends CombineWorker<Configuration, ApplyState, CombineState> {
  options = {
    formats: {
      alias: ['f', 'format'],
      desc: '-f/--formats: only generate reports for the formats specified instead of all formats',
      parse: (s: string) => new Set(s.split(',').map(toID)),
    },
    legacy: {
      alias: ['l'],
      desc: '-l/--legacy=OUTPUT: generate legacy reports and write them to OUTPUT',
    },
    all: {
      alias: ['a'],
      desc: '-a/--all: include all checks and counters in moveset reports (default: false)',
      parse: Options.boolean,
    },
  };

  async init(config: Configuration) {
    if (config.dryRun) return;

    await fs.mkdir(config.output, {recursive: true});

    if (config.legacy) {
      await fs.mkdir(config.legacy, {recursive: true});
      const monotype = path.resolve(config.legacy, 'monotype');
      await fs.mkdir(monotype);
      await Promise.all([...mkdirs(config.legacy), ...mkdirs(monotype)]);
    }
  }

  accept(config: Configuration) {
    return (format: ID) => {
      if ((config.formats && !config.formats.has(format)) ||
        format.startsWith('seasonal') || SKIP.some(f => format.includes(f))) {
        return 0;
      } else if (format === 'gen8monotype') {
        // Given that we compute all the monotype team tags for gen8monotype, we need to
        // weight the format to make sure a batch uses up approximately the same amount
        // of memory during computation compared to the other formats.
        return MONOTYPES.size + 1;
      } else {
        return 1;
      }
    };
  }

  setupApply(format: ID): ApplyState {
    format = canonicalizeFormat(format);
    return {
      gen: forFormat(format),
      format,
      stats: {total: {}, tags: {}},
      cutoffs: cutoffsFor(format, '2020-09'), // FIXME need date..., batch could leave month :( just use config?
    };
  }

  async readLog(log: string, state: ApplyState) {
    const raw = JSON.parse(await this.storage.logs.read(log));
    const battle = Parser.parse(state.gen, state.format, raw);
    const tags = state.format === 'gen8monotype' ? MONOTYPES : undefined;
    Stats.updateTagged(state.gen, state.format, battle, state.cutoffs, state.stats, tags);
  }

  writeCheckpoint(batch: Batch, state: ApplyState): JSONCheckpoint<TaggedStatistics> {
    return Checkpoints.json(batch.format, batch.begin, batch.end, state.stats);
  }

  setupCombine(format: ID): CombineState {
    return {}; // TODO
  }

  async readCheckpoint(batch: Batch, state: CombineState) {
    // TODO
  }

  async writeCombined(format: ID, state: CombineState) {
    // TODO
  }
}

function mkdirs(dir: string) {
  const mkdir = (d: string) => fs.mkdir(path.resolve(dir, d));
  return [mkdir('chaos'), mkdir('leads'), mkdir('moveset'), mkdir('metagame')];
}

function cutoffsFor(format: ID, date: string) {
  // Legacy cutoffs finally got addressed a few months into Gen 8
  if (!format.startsWith('gen8') && date > '2020-01') return CUTOFFS.default;
  // gen7doublesu ou and smogondoublessuspecttest have used different weights over the years
  if (format === 'gen7doublesou' && (date < '2017-02' || date > '2020-01')) return CUTOFFS.default;
  if (format === 'smogondoublessuspecttest' && date === '2015-04') return CUTOFFS.popular;
  // Otherwise, formats deemed 'popular' are assigned higher weight. Note that legacy format
  // notation is signficant here: gen6ou was only 'popular' while it was still called 'ou'
  format = (format.endsWith('suspecttest') ? format.slice(0, -11) : format) as ID;
  return POPULAR.has(format) ? CUTOFFS.popular : CUTOFFS.default;
}

register(StatsWorker);
export = StatsWorker;
