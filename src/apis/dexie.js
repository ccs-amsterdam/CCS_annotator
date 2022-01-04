import Dexie from "dexie";
import { prepareDocumentBatch } from "library/prepareDocumentBatch";
import { standardizeCodes } from "ccs-annotator-client";

const dbName = "CSSannotator_V1";
const idbStores = {
  codingjobs: "++id, name", // unindexed fields: jobcreator, codingscheme, codebook, codebookEdit, returnAddress
  documents: "doc_uid, job_id", // unindexed fields: title, text, meta, tokens, annotations
  tasks: "[title+url], last_modified, url", // unindexed fields:  codebook, items

  unitsets: "++id, name",
  codebooks: "++id, name",

  deployedJobs: "++id, title, url", // unindexed: title, created
  localJobs: "++id, title, last_modified, id", // unindexed fields:  codebook, items
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

  // GENERAL
  async getTableBatch(table, offset, limit, columns, reverse = false) {
    if (offset !== null && offset < 0) return null;
    let rows = await this.idb.table(table);
    const n = await rows.count();
    if (reverse) rows = rows.reverse();
    if (offset !== null && offset > n - 1) return null;
    if (limit !== null) rows = rows.offset(offset).limit(limit);

    return await extractColumns(rows, columns);
  }
  async getTableFromIds(table, ids, columns, reverse = false) {
    if (ids.length === 0) return [];
    let rows = this.idb.table(table).where("id").anyOf(ids);
    if (reverse) rows = rows.reverse();

    return await extractColumns(rows, columns);
  }
  async getTableN(table) {
    console.log(table);
    let rows = await this.idb.table(table);
    return rows.count();
  }
  async deleteTableIds(table, ids) {
    if (ids.length === 0) return [];
    await this.idb.table(table).where("id").anyOf(ids).delete();
  }
  async textSearch(table, fields, query, key, any) {
    // table: what table to search
    // fields: what columns to search
    // query: direct text match
    // key, any: optionally, filter on an indexed key, where any is an array of values
    let regex = null;
    if (query !== "") regex = new RegExp(query.replace(/[-/\\^$*+?.()|[\]{}]/g, "\\$&"));

    let rows = await this.idb.table(table);

    let selection = [];
    let collection = any == null ? await rows.toCollection() : await rows.where(key).anyOf(any);
    await collection.each((row) => {
      for (let field of fields) {
        if (regex === null) {
          selection.push(row.id);
          return;
        }
        if (regex.test(row[field])) {
          selection.push(row.id);
          return;
        }
      }
    });
    return selection;
  }

  async getCodingjobProp(codingjob, prop) {
    const id = typeof codingjob === "object" ? codingjob.id : codingjob;
    let cj = await this.idb.codingjobs.get(id);
    return cj[prop];
  }
  async setCodingjobProp(codingjob, prop, value) {
    const id = typeof codingjob === "object" ? codingjob.id : codingjob;
    let cj = await this.idb.codingjobs.get(id);
    if (cj.settings == null) cj.settings = {};
    return this.idb.codingjobs
      .where("id")
      .equals(id)
      .modify({ [prop]: value });
  }

  // DOCUMENTS
  async createDocuments(codingjob, documentList, silent = false) {
    const id = typeof codingjob === "object" ? codingjob.id : codingjob;
    let ids = new Set(await this.idb.documents.where("job_id").equals(id).primaryKeys());

    const [preparedDocuments, codes] = prepareDocumentBatch(documentList, ids, id, silent);

    let importedCodes = await this.getCodingjobProp(codingjob, "importedCodes");
    importedCodes = updateImportedCodes(codingjob, importedCodes, codes);

    this.idb.codingjobs.where("id").equals(id).modify({ importedCodes });
    return this.idb.documents.bulkAdd(preparedDocuments);
  }

  async deleteDocuments(documents) {
    const documentIds = documents.map((document) => document.doc_uid);
    return this.idb.documents.bulkDelete(documentIds);
  }

  async getJobDocuments(codingjob, offset, limit) {
    const id = typeof codingjob === "object" ? codingjob.id : codingjob;

    if (offset !== null && offset < 0) return null;
    let documents = await this.idb.documents.where("job_id").equals(id);
    const ndocs = await documents.count();
    if (offset !== null && offset > ndocs - 1) return null;
    if (limit !== null) documents = documents.offset(offset).limit(limit);
    return documents.toArray();
  }

  async getJobDocumentCount(codingjob) {
    const id = typeof codingjob === "object" ? codingjob.id : codingjob;
    return this.idb.documents.where("job_id").equals(id).count();
  }

  async getDocuments(codingjob) {
    const id = typeof codingjob === "object" ? codingjob.id : codingjob;
    return this.idb.documents.where("job_id").equals(id);
  }

  async getDocument(doc_uid) {
    return this.idb.documents.get(doc_uid);
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

const extractColumns = async (rows, columns) => {
  const data = [];
  await rows.each((row) => {
    const values = {};
    for (let col of columns) {
      values[col.name] = col.f ? col.f(row) : row[col.name];
    }
    data.push(values);
  });
  return data;
};

const db = new AnnotationDB();
export default db;
