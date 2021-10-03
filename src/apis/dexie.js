import Dexie from "dexie";
import hash from "object-hash";

import { prepareDocumentBatch } from "util/createDocuments";

class AnnotationDB {
  constructor() {
    this.idb = new Dexie("AmCAT_Annotator");

    // for testing, clean db on refresh
    //this.idb.delete();
    //this.idb = new Dexie("AmCAT_Annotator");

    this.idb.version(2).stores({
      meta: "welcome", // this just serves to keep track of whether db was 'created' via the welcome component
      apis: "api", // unindexed fields: token, refresh_token, expiration_date,
      codingjobs: "job_id, name", // unindexed fields: jobcreator, codingscheme, codebook, codebookEdit, returnAddress

      documents: "doc_uid, job_id", // unindexed fields: title, text, meta, tokens, annotations
    });
  }

  // META
  async welcome() {
    if (!(await this.isWelcome())) {
      this.idb.meta.add({ welcome: 1 });
    }
    return null;
  }
  async isWelcome() {
    return this.idb.meta.get(1);
  }

  // API TOKENS (probably remove. Make different db instances for different API backends)
  async addToken(api, token) {
    return this.idb.apis.put({
      api,
      token: token.token,
      refresh_token: token.refresh_token,
      expiration_date: token.expiration_date,
    });
  }
  async deleteToken(api) {
    return this.idb.apis.delete(api);
  }
  async getToken(api) {
    return this.idb.apis.get(api);
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
  async listCodingjobs() {
    return await this.idb.codingjobs.toArray();
  }
  async getCodingjob(codingjob) {
    return this.idb.codingjobs.get(codingjob.job_id);
  }
  async getCodingjobProp(codingjob, prop) {
    let cj = await this.getCodingjob(codingjob);
    return cj[prop];
  }
  async setCodingjobProp(codingjob, prop, value) {
    let cj = await this.getCodingjob(codingjob);
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
    const cj = await this.getCodingjob(codingjob);
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
  async modifyAnnotations(codingjob, oldCodes, newCode) {
    // renames oldCodes to newCode
    // if newCode is falsy, removes oldCodes

    // This is a dangerous operation, since it could break codes.
    // needs some extra security and maybe a backup plan
    // (like, lookup all annotations that have invalid codes, and rename them)
    let ids = new Set(
      await this.idb.documents.where("job_id").equals(codingjob.job_id).primaryKeys()
    );
    for (let id of ids) {
      let doc = await this.getDocument(id);

      for (let textUnit of Object.keys(doc.annotations)) {
        for (let i of Object.keys(doc.annotations[textUnit])) {
          for (let oldCode of oldCodes) {
            if (doc.annotations[textUnit][i][oldCode]) {
              if (newCode)
                doc.annotations[textUnit][i][newCode] = doc.annotations[textUnit][i][oldCode];
              delete doc.annotations[textUnit][i][oldCode];
            }
          }
        }
      }

      await this.writeAnnotations(doc, doc.annotations);
    }
  }

  // CLEANUP
  async deleteDB() {
    await this.idb.meta.clear();
    await this.idb.apis.clear();
    await this.idb.codingjobs.clear();
    await this.idb.documents.clear();
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
