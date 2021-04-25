import Dexie from "dexie";
import hash from "object-hash";

export default class AnnotationDB {
  constructor() {
    this.idb = new Dexie("AmCAT_Annotator");
    this.idb.version(1).stores({
      apis: "api", // unindexed fields: token, refresh_token, expiration_date,
      codingjobs: "job_id, name", // unindexed fields: jobcreator, codingscheme, codebook, codebookEdit, returnAddress
      documents: "doc_id, job_id", // unindexed fields: title, text, meta, tokens, annotations
    });
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
    const documents = await this.listDocuments(codingjob);
    await this.deleteDocuments(documents);
    return this.idb.codingjobs.delete(codingjob.job_id);
  }
  async listCodingjobs() {
    const test = await this.idb.codingjobs.toArray();
    console.log(test);
    return test;
  }
  async getCodingjob(codingjob) {
    return this.idb.codingjobs.get(codingjob.job_id);
  }
  async writeCodebook(codingjob, codebook) {
    console.log(codingjob);
    return this.idb.codingjobs
      .where("job_id")
      .equals(codingjob.job_id)
      .modify({ codebook: JSON.stringify(codebook, null, 2) });
  }

  // DOCUMENTS
  async createDocuments(codingjob, documentList, silent = false) {
    let ids = new Set(
      await this.idb.documents
        .where("job_id")
        .equals(codingjob.job_id)
        .primaryKeys()
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
      let message = `Created ${
        documentList.length - duplicates
      } new documents in codingjob ${codingjob.name}.`;
      if (duplicates > 0)
        message = message + ` Ignored ${duplicates} duplicates`;
      alert(message);
    }

    return this.idb.documents.bulkAdd(preparedDocuments);
  }
  async deleteDocuments(documents) {
    const documentIds = documents.map((document) => document.doc_id);
    return this.idb.documents.bulkDelete(documentIds);
  }
  async listDocuments(codingjob) {
    // uses each to only fetch specific fields from document
    // saves memory at minor speed penalty
    function map(coll, mapperFn) {
      let result = [];
      let i = 1;
      return coll
        .each((row) => result.push({ doc: i++, ...mapperFn(row) }))
        .then(() => result);
    }
    let doclist = this.idb.documents.where("job_id").equals(codingjob.job_id);
    return map(doclist, (doc) => ({
      doc_id: doc.doc_id,
      title: doc.title,
      annotations: doc.annotations,
    }));
  }
  async getDocument(doc_id) {
    return this.idb.documents.get(doc_id);
  }

  async writeAnnotations(document, annotations) {
    return this.idb.documents
      .where("doc_id")
      .equals(document.doc_id)
      .modify({ annotations: JSON.stringify(annotations, null, 2) });
  }

  // CLEANUP
  async deleteDB() {
    return this.idb.delete();
  }
}
