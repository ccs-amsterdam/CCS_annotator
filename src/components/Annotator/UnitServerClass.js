import axios from "axios";
import db from "apis/dexie";

/**
 * Class for jobs hosted on a server
 */
export class UnitServerRemote {
  constructor(url, coderName) {
    this.url = url;
    this.coderName = coderName;
    this.where = "remote";
  }

  async init() {
    // needs to be called in order to fetch codebook/rules
    let response;
    try {
      response = await axios.get(`${this.url}/codebook`);
    } catch (e) {
      console.log(e);
      this.success = false;
      return;
    }
    this.success = true;
    this.codebook = response.data;

    // this should come from rules
    this.rules = { n: 20, canGoBack: false, canGoForward: false };
  }

  async get(i) {
    const response = await axios.get(`${this.url}/unit?user=${this.coderName}`);
    return response.data;
  }

  post(unit_id, data) {
    axios.post(`${this.url}/unit/${unit_id}/annotation?user=${this.coderName}`, data);
  }
}

/**
 * Class for jobs using local data in Indexed DB
 */
export class UnitServerLocal {
  constructor(url, coderName) {
    this.url = url;
    this.coderName = coderName;
    this.where = "local";
  }

  async init() {
    // needs to be called in order to fetch codebook/rules
    let task = await db.idb.tasks.get({ url: this.url });
    if (!task) {
      this.success = false;
      return null;
    }

    this.success = true;
    this.units = task.units;
    this.codebook = task.codebook;

    this.rules = { n: task.units.length, canGoBack: true, canGoForward: false };
  }

  async get(i) {
    const unit_id = this.units[i].unit_id;
    let annotations = await db.getAnnotations(unit_id);
    annotations = annotations?.annotations || [];
    return {
      url: this.url,
      id: unit_id,
      unit: { ...this.units[i], annotations },
    };
  }

  async post(unit_id, data) {
    db.postAnnotations(this.url, unit_id, data);
  }
}
