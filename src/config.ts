import {ID, toID} from 'ps';

// The maximum number of files we'll potentially have open at once. `ulimit -n` on most systems
// should be at least 1024 by default, but we'll set a more more conservative limit to avoid running
// into EMFILE errors. Each worker will be able to open (maxFiles / numWorkers) files which is also
// more conservative, but coordinating the exact number of files open across processes is more
// likely not worth the complexity or coordination overhead.
const MAX_FILES = 256;

// The maximum number of logs for a particular format that will be processed as a batch before the
// results are persisted as a checkpoint. Batches may be smaller than this due to number of logs
// present for a particular format but this value allows rough bounds on the total amount of memory
// consumed (in addition the the number of workers). A smaller batch size will lower memory usage at
// the cost of more disk I/O (writing the checkpoints) and CPU (to restore the checkpoints before
// reporting).
//
// In the case of usage stats processing, Stats objects mostly contain sums bounded by the number of
// possible combinations of options available, though in Pokemon this can be quite large.
// Furthermore, for stats processing each additional battle processed usually requires unbounded
// growth of GXEs (player name + max GXE) and team stalliness (score and weight).
const BATCH_SIZE = 8192;

export interface Configuration {
  logs: string;
  reports: string;
  checkpoints: string;
  numWorkers: number;
  maxFiles: number;
  batchSize: number;
  verbose: number;
  dryRun: boolean;
  all: boolean;
  worker: 'stats';
  accept: (raw: string) => (ID | undefined);
}

export class Options extends Partial<Configuration> {
  logs: string;
  reports: string;
  verbose?: boolean|number;

  constructor(logs: string, reports: string) {
    this.logs = logs;
    this.reports = reports;
  }

  toOptions() {
    return Options.toConfiguration(this);
  }

  static toConfiguration(options: Options) {
    const numWorkers = options.numWorkers || (os.cpus().length - 1);
    const maxFiles = (!options.maxFiles || options.maxFiles > 0) ?
        Math.floor((options.maxFiles || MAX_FILES) / numWorkers) :
        Infinity;
    const batchSize = (!options.batchSize || options.batchSize > 0) ?
        (options.batchSize || BATCH_SIZE) :
        Infinity;
    return {
      logs: options.logs, reports: options.reports, checkpoints: options.checkpoints!;
      numWorkers, maxFiles, batchSize, verbose: +options.verbose, dryRun: !!options.dryRun,
          all: !!options.all, worker: 'stats', accept: toID,
    };
  }
}
