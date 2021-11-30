import axios from "axios";
import db from "apis/dexie";

/**
 * Class for jobs hosted on a server
 */
export class JobServerRemote {
  constructor(url, coderName) {
    this.url = url;
    this.coderName = coderName;
    this.where = "remote";
  }

  async init() {
    // needs to be called in order to fetch codebook/rules
    let response;
    try {
      const url = new URL(this.url);
      const codingjobID = url.pathname.split("/")[2];

      response = await axios.get(`${this.url}/codebook?id=${codingjobID}&user=${this.coderName}`);
    } catch (e) {
      this.success = false;
      return;
    }
    this.success = true;
    this.codebook = response.data;

    // this should come from rules
    this.rules = { n: 20, canGoBack: false, canGoForward: false };

    // this should somehow be provided by amcat
    this.progressIndex = 0;
  }

  async getUnit(i) {
    //
    const response = await axios.get(`${this.url}/unit?user=${this.coderName}`);
    return response.data;
    // data should be an object with url, id and unit, where unit is an object with at least text_fields,
    // and if available annotations
  }

  postAnnotations(unit_id, data) {
    axios.post(`${this.url}/unit/${unit_id}/annotation?user=${this.coderName}`, data);
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
    // needs to be called in order to fetch codebook/rules
    let job = await db.idb.localJobs.get({ id: this.id });
    if (!job) {
      this.success = false;
      return null;
    }

    this.success = true;
    this.units = job.units;
    this.codebook = job.codebook;
    this.title = job.title;
    this.set = job.set;
    this.rules = { n: job.units.length, canGoBack: true, canGoForward: false };

    this.progressIndex = job.progressIndex || 0;
  }

  async getUnit(i) {
    if (i !== null) {
      // on get unit, also update progress.
      // progressindex is the index of the currently fetched unit.
      await db.idb.localJobs
        .where("id")
        .equals(this.id)
        .modify({ progressIndex: Math.max(i, this.progressIndex), last_modified: new Date() });
    }

    const unit_id = this.units[i].unit_id;
    let annotations = await db.getUnitAnnotations(this.id, unit_id);
    annotations = annotations?.annotations || [];

    return {
      id: unit_id,
      unit: { ...this.units[i], annotations },
    };
  }

  async postAnnotations(unit_id, data) {
    db.postAnnotations(this.id, unit_id, data);
  }
}
