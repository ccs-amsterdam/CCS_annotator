import db from "apis/dexie";

/**
 * Class for jobs hosted on a server
 */
export class JobServerRemote {
  constructor(amcat, job_id) {
    this.amcat = amcat;
    this.job_id = job_id;
    this.where = "remote";
  }

  async init() {
    try {
      this.codebook = await this.amcat.getCodebook(this.job_id);
      this.progress = await this.amcat.getProgress(this.job_id);
    } catch (e) {
      console.log(e);
      this.success = false;
      return;
    }
    this.success = true;
  }

  async getUnit(i) {
    const getNext = i >= this.progress.n_coded && !this.progress.seek_forwards;
    this.progress.n_coded = Math.max(i, this.progress.n_coded);
    return await this.amcat.getUnit(this.job_id, getNext ? null : i);
  }

  postAnnotations(unit_id, annotation, status) {
    this.amcat.postAnnotation(this.job_id, unit_id, annotation, status);
  }
}

/**
 * Class for jobs using local data in Indexed DB
 */
export class JobServerLocal {
  constructor(id, coderName) {
    this.id = id;
    this.coderName = coderName;
    this.where = "local";
  }

  async init() {
    let job = await db.idb.localJobs.get({ id: this.id });
    if (!job) {
      this.success = false;
      return null;
    }

    this.success = true;
    this.title = job.title;
    this.units = job.units;
    this.set = job.set;

    this.codebook = job.codebook;
    this.progress = {
      n_total: job.units.length,
      n_coded: job.n_coded || 0,
      seek_backwards: true,
      seek_forwards: false,
    };
  }

  async getUnit(i) {
    if (i !== null) {
      this.progress.n_coded = Math.max(i, this.progress.n_coded);
      // on get unit, also update progress.
      // progressindex is the index of the currently fetched unit.
      await db.idb.localJobs
        .where("id")
        .equals(this.id)
        .modify({ n_coded: Math.max(i, this.progress.n_coded), last_modified: new Date() });
    }

    const unit_id = this.units[i].unit_id;
    let annotations = await db.getUnitAnnotations(this.id, unit_id);
    const status = annotations?.status;
    annotations = annotations?.annotations || [];

    return {
      id: unit_id,
      unit: { ...this.units[i] },
      annotations,
      status,
    };
  }

  async postAnnotations(unit_id, annotation, status) {
    db.postAnnotations(this.id, unit_id, annotation, status);
  }
}
