import Dexie from "dexie";
import hash from "object-hash";
import newAmcatSession from "./amcat";

import { prepareDocumentBatch } from "util/createDocuments";

class AnnotationDB {
  constructor() {
    this.idb = new Dexie("AmCAT_Annotator");

    //for testing, clean db on refresh
    // this.idb.delete();
    // this.idb = new Dexie("AmCAT_Annotator");
    try {
      this.idb.version(2).stores({
        user: "++id, name", // other fields: 'id'
        codingjobs: "job_id, name", // unindexed fields: jobcreator, codingscheme, codebook, codebookEdit, returnAddress
        documents: "doc_uid, job_id", // unindexed fields: title, text, meta, tokens, annotations
        tasks: "[title+url], last_modified, url", // unindexed fields:  codebook, items
      });
    } catch (e) {
      // this is not a good idea for production, but for now it helps
      this.idb.delete();
      this.idb = new Dexie("AmCAT_Annotator");
      this.idb.version(2).stores({
        user: "++id, name", // other fields: 'id'
        codingjobs: "job_id, name", // unindexed fields: jobcreator, codingscheme, codebook, codebookEdit, returnAddress
        documents: "doc_uid, job_id", // unindexed fields: title, text, meta, tokens, annotations
        tasks: "[title+url], last_modified, url", // unindexed fields:  codebook, items
      });
    }
  }

  // USER
  async firstLogin(name) {
    if (await this.newUser()) {
      this.idb.user.add({ name });
    }
    return null;
  }
  async newUser() {
    return (await this.idb.user.toArray()).length === 0;
  }
  async setAmcatAuth(host, email, token) {
    return await this.idb.user.where("id").equals(1).modify({ amcat: { host, email, token } });
  }
  async resetAmcatAuth() {
    return await this.idb.user.where("id").equals(1).modify({ amcat: undefined });
  }
  async amcatSession() {
    const user = await this.idb.user.get(1);
    if (user?.amcat) return newAmcatSession(user.amcat.host, user.amcat.email, user.amcat.token);
    return null;
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
    await this.idb.documents.where("job_id").equals(codingjob.job_id).delete();
    return this.idb.codingjobs.delete(codingjob.job_id);
  }

  async getCodingjobProp(codingjob, prop) {
    let cj = await this.idb.codingjobs.get(codingjob.job_id);
    return cj[prop];
  }
  async setCodingjobProp(codingjob, prop, value) {
    let cj = await this.idb.codingjobs.get(codingjob.job_id);
    if (cj.settings == null) cj.settings = {};
    return this.idb.codingjobs
      .where("job_id")
      .equals(codingjob.job_id)
      .modify({ [prop]: value });
  }

  async writeCodebook(codingjob, codebook) {
    console.log("writing to db");
    return this.idb.codingjobs
      .where("job_id")
      .equals(codingjob.job_id)
      .modify({ codebook: codebook });
  }

  async writeCodes(codingjob, codes, append = false) {
    const cj = await this.idb.codingjobs.get(codingjob.job_id);
    const codebook = cj.codebook ? cj.codebook : {};

    if (!codebook.codes || !append) codebook.codes = codes;
    const maps = codebook.codes.reduce(
      (obj, code, i) => {
        obj.codeMap[code.code] = { parent: code.parent, index: i };
        obj.parentMap[code.parent] = true;
        return obj;
      },
      { codeMap: {}, parentMap: {} }
    );

    if (append) {
      for (let code of codes) {
        if (maps.codeMap[code.code]) {
          if (code.parent === maps.codeMap[code.code].parent) continue;
          const newcode = safeNewCode(
            code.code + " (" + code.parent + ")",
            maps.codeMap,
            maps.parentMap
          );
          codebook.codes[maps.codeMap[code].index].code = newcode;
          codebook.codes.push({ ...code, code: newcode, parent: code.parent });
        } else {
          const newcode = safeNewCode(code.code, maps.codeMap, maps.parentMap, 2);
          codebook.codes.push({ ...code, code: newcode, parent: code.parent });
        }
      }
    }

    // making absolutely sure no garbage is added
    codebook.codes = codebook.codes.filter((code) => code.code !== "");

    return await this.writeCodebook(codingjob, codebook);
  }

  // DOCUMENTS
  async createDocuments(codingjob, documentList, silent = false) {
    let ids = new Set(
      await this.idb.documents.where("job_id").equals(codingjob.job_id).primaryKeys()
    );

    const [preparedDocuments, codes] = prepareDocumentBatch(
      documentList,
      ids,
      codingjob.job_id,
      silent
    );

    this.writeCodes(codingjob, codes, true);

    return this.idb.documents.bulkAdd(preparedDocuments);
  }

  async deleteDocuments(documents) {
    const documentIds = documents.map((document) => document.doc_uid);
    return this.idb.documents.bulkDelete(documentIds);
  }

  async getJobDocuments(codingjob, offset, limit) {
    if (offset !== null && offset < 0) return null;
    let documents = await this.idb.documents.where("job_id").equals(codingjob.job_id);
    const ndocs = await documents.count();
    if (offset !== null && offset > ndocs - 1) return null;
    if (limit !== null) documents = documents.offset(offset).limit(limit);
    return documents.toArray();
  }

  async getJobDocumentCount(codingjob) {
    return this.idb.documents.where("job_id").equals(codingjob.job_id).count();
  }

  async getDocuments(codingjob) {
    return this.idb.documents.where("job_id").equals(codingjob.job_id);
  }

  async getDocument(doc_uid) {
    return this.idb.documents.get(doc_uid);
  }

  async writeTokens(document, tokens) {
    return this.idb.documents.where("doc_uid").equals(document.doc_uid).modify({ tokens: tokens });
  }

  async writeAnnotations(document, annotations) {
    return this.idb.documents
      .where("doc_uid")
      .equals(document.doc_uid)
      .modify({ annotations: annotations });
  }

  // TASKS
  async uploadTask(codingjobPackage, url, where) {
    const exists = await this.idb.tasks.get({ url });
    if (!exists) {
      this.idb.tasks.add({
        url,
        last_modified: new Date(),
        where,
        ...codingjobPackage,
      });
    } else {
      alert("This job has already been created before");
    }
  }

  // CLEANUP
  async deleteDB() {
    await this.idb.delete();
    this.idb = new Dexie("AmCAT_Annotator");
    this.idb.version(2).stores({
      user: "++id, name", // other fields: 'id'
      codingjobs: "job_id, name", // unindexed fields: jobcreator, codingscheme, codebook, codebookEdit, returnAddress
      documents: "doc_uid, job_id", // unindexed fields: title, text, meta, tokens, annotations
      tasks: "[title+url], last_modified, url", // unindexed fields:  codebook, items
    });
  }
}

const safeNewCode = (code, codeMap, parentMap, i) => {
  // for preventing overlapping code names
  if (!codeMap[code] && !parentMap[code]) return code;
  if (i > 2) code = code.slice(0, code.length - code.toString().length);
  code += " " + i;
  safeNewCode(code, codeMap, i + 1);
};

const db = new AnnotationDB();
export default db;
