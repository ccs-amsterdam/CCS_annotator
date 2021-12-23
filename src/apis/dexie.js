import Dexie from "dexie";
import hash from "object-hash";

import { prepareDocumentBatch } from "library/createDocuments";
import { standardizeCodes } from "library/codebook";

const dbName = "CSSannotator_V1";
const idbStores = {
  codingjobs: "job_id, name", // unindexed fields: jobcreator, codingscheme, codebook, codebookEdit, returnAddress
  documents: "doc_uid, job_id", // unindexed fields: title, text, meta, tokens, annotations
  tasks: "[title+url], last_modified, url", // unindexed fields:  codebook, items

  deployedJobs: "url", // unindexed: title, created
  localJobs: "[title+id], last_modified, id", // unindexed fields:  codebook, items
  localAnnotations: "[id+unit_id], id",
};

class AnnotationDB {
  constructor() {
    this.idb = new Dexie(dbName);

    //for testing, clean db on refresh
    // this.idb.delete();
    // this.idb = new Dexie(dbName);
    try {
      this.idb.version(2).stores(idbStores);
    } catch (e) {
      // this is not a good idea for production, but for now it helps solve the problem
      // that whenever the schemas are changed (in development), everything breaks
      this.idb.delete();
      this.idb = new Dexie(dbName);
      this.idb.version(2).stores(idbStores);
    }
  }

  // CODINGJOBS
  async createCodingjob(name, job_id = null) {
    if (!job_id) job_id = hash([name, Date.now().toString()]);
    this.idb.codingjobs.add({
      job_id,
      name,
    });
    return { job_id, name };
  }
  async deleteCodingjob(codingjob) {
    const id = typeof codingjob === "object" ? codingjob.job_id : codingjob;
    const docs = await this.idb.documents.where("job_id").equals(id);
    const ndocs = await docs.count();
    if (ndocs > 0) docs.delete();
    return this.idb.codingjobs.delete(id);
  }

  async getCodingjobProp(codingjob, prop) {
    const id = typeof codingjob === "object" ? codingjob.job_id : codingjob;
    let cj = await this.idb.codingjobs.get(id);
    return cj[prop];
  }
  async setCodingjobProp(codingjob, prop, value) {
    const id = typeof codingjob === "object" ? codingjob.job_id : codingjob;
    let cj = await this.idb.codingjobs.get(id);
    if (cj.settings == null) cj.settings = {};
    return this.idb.codingjobs
      .where("job_id")
      .equals(id)
      .modify({ [prop]: value });
  }

  // DOCUMENTS
  async createDocuments(codingjob, documentList, silent = false) {
    const id = typeof codingjob === "object" ? codingjob.job_id : codingjob;
    let ids = new Set(await this.idb.documents.where("job_id").equals(id).primaryKeys());

    const [preparedDocuments, codes] = prepareDocumentBatch(documentList, ids, id, silent);

    let importedCodes = await this.getCodingjobProp(codingjob, "importedCodes");
    importedCodes = updateImportedCodes(codingjob, importedCodes, codes);

    this.idb.codingjobs.where("job_id").equals(id).modify({ importedCodes });
    return this.idb.documents.bulkAdd(preparedDocuments);
  }

  async deleteDocuments(documents) {
    const documentIds = documents.map((document) => document.doc_uid);
    return this.idb.documents.bulkDelete(documentIds);
  }

  async getJobDocuments(codingjob, offset, limit) {
    const id = typeof codingjob === "object" ? codingjob.job_id : codingjob;

    if (offset !== null && offset < 0) return null;
    let documents = await this.idb.documents.where("job_id").equals(id);
    const ndocs = await documents.count();
    if (offset !== null && offset > ndocs - 1) return null;
    if (limit !== null) documents = documents.offset(offset).limit(limit);
    return documents.toArray();
  }

  async getJobDocumentCount(codingjob) {
    const id = typeof codingjob === "object" ? codingjob.job_id : codingjob;
    return this.idb.documents.where("job_id").equals(id).count();
  }

  async getDocuments(codingjob) {
    const id = typeof codingjob === "object" ? codingjob.job_id : codingjob;
    return this.idb.documents.where("job_id").equals(id);
  }

  async getDocument(doc_uid) {
    return this.idb.documents.get(doc_uid);
  }

  async writeTokens(document, tokens) {
    return this.idb.documents.where("doc_uid").equals(document.doc_uid).modify({ tokens: tokens });
  }

  // DEPLOYED JOBS
  async createDeployedJob(title, url) {
    const exists = await this.idb.deployedJobs.get({ url });

    if (!exists) {
      this.idb.deployedJobs.add({
        title,
        url,
        created: new Date(),
      });
    } else {
      this.idb.deployedJobs.get({ url }).modify({ created: new Date() });
    }
  }

  // LOCAL JOBS
  async createLocalJob(codingjobPackage, id) {
    const exists = await this.idb.localJobs.get({ id });

    if (!exists) {
      this.idb.localJobs.add({
        ...codingjobPackage,
        id,
        last_modified: new Date(),
      });
    } else {
      alert("This job has already been created before");
    }
  }

  // ANNOTATIONS
  async getUnitAnnotations(job_id, unit_id) {
    return this.idb.localAnnotations.get({ id: job_id, unit_id });
  }
  async getAllAnnotations(job_id) {
    return this.idb.localAnnotations.where("id").equals(job_id).toArray();
  }
  async postAnnotations(job_id, unit_id, annotations, status) {
    return this.idb.localAnnotations.put({ unit_id, id: job_id, annotations, status }, [
      job_id,
      unit_id,
    ]);
  }

  // CLEANUP
  async deleteDB() {
    await this.idb.delete();
    this.idb = new Dexie(dbName);
    this.idb.version(2).stores(idbStores);
    window.location.reload(false);
  }
}

const updateImportedCodes = (codingjob, importedCodes, codes) => {
  const addCodes = Object.keys(codes).reduce((obj, key) => {
    const codesArray = standardizeCodes(Array.from(codes[key]));
    obj[key] = codesArray.map((code) => ({ ...code, frozen: true }));
    return obj;
  }, {});

  if (!importedCodes) return addCodes;

  for (let key of Object.keys(addCodes)) {
    if (!importedCodes[key]) {
      importedCodes[key] = addCodes[key];
    } else {
      for (let code of addCodes[key]) {
        if (!importedCodes[key].some((c) => c.code === code.code)) {
          importedCodes[key].push(code);
        }
      }
    }
  }
  return importedCodes;
};

const db = new AnnotationDB();
export default db;
