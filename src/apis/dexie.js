import Dexie from "dexie";
import hash from "object-hash";

class AnnotationDB {
  constructor() {
    this.idb = new Dexie("AmCAT_Annotator");
    this.idb.version(2).stores({
      meta: "welcome", // this just serves to keep track of whether db was 'created' via the welcome component
      apis: "api", // unindexed fields: token, refresh_token, expiration_date,
      codingjobs: "job_id, name", // unindexed fields: jobcreator, codingscheme, codebook, codebookEdit, returnAddress
      documents: "doc_id, job_id", // unindexed fields: title, text, meta, tokens, annotations
    });
  }

  // META
  async welcome() {
    if (!(await this.isWelcome())) this.idb.meta.add({ welcome: 1 });
    return null;
  }
  async isWelcome() {
    return this.idb.meta.get(1);
  }

  // API TOKENS
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
  async createCodingjob(name) {
    const job_id = hash([name, Date.now().toString()]);
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
    const test = await this.idb.codingjobs.toArray();
    return test;
  }
  async getCodingjob(codingjob) {
    return this.idb.codingjobs.get(codingjob.job_id);
  }
  async writeCodebook(codingjob, codebook) {
    return this.idb.codingjobs
      .where("job_id")
      .equals(codingjob.job_id)
      .modify({ codebook: JSON.stringify(codebook, null, 2) });
  }
  async writeCodes(codingjob, codes) {
    const cj = await this.getCodingjob(codingjob);
    const codebook = JSON.parse(cj.codebook);
    codebook.codes = codes;
    return await this.writeCodebook(codingjob, codebook);
  }

  // DOCUMENTS
  async createDocuments(codingjob, documentList, silent = false) {
    let ids = new Set(
      await this.idb.documents.where("job_id").equals(codingjob.job_id).primaryKeys()
    );

    let duplicates = 0;
    const preparedDocuments = documentList.reduce((result, document) => {
      const doc_id = hash([document, codingjob]); // codingjob included for doc_id hash
      if (!ids.has(doc_id)) {
        ids.add(doc_id);
        if (document.annotations && document.annotations.length > 0) {
          try {
            JSON.parse(document.annotations);
          } catch (e) {
            alert("Annotations field contains invalid JSON");
            throw new Error("JSON parse error");
          }
        }
        result.push({
          doc_id: doc_id,
          job_id: codingjob.job_id,
          ...document,
        });
      } else {
        duplicates++;
      }
      return result;
    }, []);

    if (!silent) {
      let message = `Created ${documentList.length - duplicates} new documents in codingjob ${
        codingjob.name
      }.`;
      if (duplicates > 0) message = message + ` Ignored ${duplicates} duplicates`;
      alert(message);
    }

    return this.idb.documents.bulkAdd(preparedDocuments);
  }
  async deleteDocuments(documents) {
    const documentIds = documents.map((document) => document.doc_id);
    return this.idb.documents.bulkDelete(documentIds);
  }

  async getJobDocumentsBatch(codingjob, offset, limit) {
    if (offset < 0) return null;
    const documents = await this.idb.documents.where("job_id").equals(codingjob.job_id);
    const ndocs = await documents.count();
    if (offset > ndocs - 1) return null;
    return documents.offset(offset).limit(limit).toArray();
  }

  async getJobDocumentCount(codingjob) {
    return this.idb.documents.where("job_id").equals(codingjob.job_id).count();
  }

  async getDocument(doc_id) {
    return this.idb.documents.get(doc_id);
  }

  async writeTokens(document, tokens) {
    return this.idb.documents
      .where("doc_id")
      .equals(document.doc_id)
      .modify({ tokens: JSON.stringify(tokens, null, 2) });
  }

  async writeAnnotations(document, annotations) {
    return this.idb.documents
      .where("doc_id")
      .equals(document.doc_id)
      .modify({ annotations: JSON.stringify(annotations, null, 2) });
  }

  // CLEANUP
  async deleteDB() {
    await this.idb.meta.clear();
    await this.idb.apis.clear();
    await this.idb.codingjobs.clear();
    await this.idb.documents.clear();
  }
}

const db = new AnnotationDB();
export default db;
