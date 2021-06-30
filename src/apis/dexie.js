import Dexie from "dexie";
import hash from "object-hash";
import { importTokens, importTokenAnnotations, parseTokens } from "../util/tokens";
import { importSpanAnnotations } from "../util/annotations";

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
    if (!(await this.isWelcome())) this.idb.meta.add({ welcome: 1 });
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
    const test = await this.idb.codingjobs.toArray();
    return test;
  }
  async getCodingjob(codingjob) {
    return this.idb.codingjobs.get(codingjob.job_id);
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

    if (!append) {
      codebook.codes = codes;
    } else {
      if (!codebook.codes) codebook.codes = [];
      const codeMap = codebook.codes.reduce((obj, code, i) => {
        obj[code.code] = { parent: code.parent, index: i };
        return obj;
      }, {});
      const parentMap = codebook.codes.reduce((obj, code, i) => {
        obj[code.parent] = true;
        return obj;
      }, {});
      for (let code of codes) {
        if (codeMap[code.code]) {
          if (code.parent === codeMap[code.code].parent) continue;
          const newcode = safeNewCode(code.code + " (" + code.parent + ")", codeMap, parentMap, 2);
          codebook.codes[codeMap[code].index].code = newcode;
          codebook.codes.push({ code: newcode, parent: code.parent });
        } else {
          const newcode = safeNewCode(code.code, codeMap, parentMap, 2);
          codebook.codes.push({ code: newcode, parent: code.parent });
        }
      }
    }
    return await this.writeCodebook(codingjob, codebook);
  }

  // DOCUMENTS
  async createDocuments(codingjob, documentList, silent = false) {
    let ids = new Set(
      await this.idb.documents.where("job_id").equals(codingjob.job_id).primaryKeys()
    );

    let duplicates = 0;
    let codes = {};
    const preparedDocuments = documentList.reduce((result, document) => {
      const doc_uid = hash([document, codingjob]); // codingjob included for doc_uid (8nique id) hash
      if (!ids.has(doc_uid)) {
        ids.add(doc_uid);

        if (document.tokens) {
          document.tokens = importTokens(document.tokens);
        } else {
          document.tokens = parseTokens(document.text_fields);
        }
        if (document.tokens.length > 0) {
          document.n_paragraphs = document.tokens[document.tokens.length - 1].paragraph;
          document.n_sentences = document.tokens[document.tokens.length - 1].sentence;
        } else {
          document.n_paragraphs = 0;
          document.n_sentences = 0;
        }

        if (document.annotations && document.annotations.length > 0) {
          try {
            document.annotations = importSpanAnnotations({}, JSON.parse(document.annotations));
          } catch (e) {
            alert("Annotations field could not be imported");
            throw new Error("JSON parse error");
          }
        } else document.annotations = {};

        const tokenAnnotations = importTokenAnnotations(document.tokens, codes); // also fills codes
        if (tokenAnnotations.length > 0)
          document.annotations = importSpanAnnotations(
            document.annotations,
            tokenAnnotations,
            document.tokens
          );

        result.push({
          doc_uid: doc_uid,
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

    codes = Object.keys(codes).reduce((a, code) => {
      for (let parent of codes[code]) a.push({ code, parent });
      return a;
    }, []);
    this.writeCodes(codingjob, codes, true);

    console.log(preparedDocuments);
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

  async getCodingjobItems(codingjob, codingUnit) {
    let documents = await this.idb.documents.where("job_id").equals(codingjob.job_id);
    const cjIndices = [];
    let docIndex = 0;
    await documents.each((e) => {
      if (codingUnit === "document") cjIndices.push({ document_id: e.document_id, docIndex });

      if (codingUnit === "paragraph") {
        const paragraphs = e.tokens[e.tokens.length - 1].paragraph;
        console.log(paragraphs);
        for (let parIndex = 0; parIndex <= paragraphs; parIndex++)
          cjIndices.push({ document_id: e.document_id, docIndex, parIndex });
      }

      if (codingUnit === "sentence") {
        const sentences = e.tokens[e.tokens.length - 1].sentence;
        for (let sentIndex = 0; sentIndex <= sentences; sentIndex++)
          cjIndices.push({ document_id: e.document_id, docIndex, sentIndex });
      }

      if (codingUnit === "annotation") {
        if (e.annotations) {
          for (let i of Object.keys(e.annotations)) {
            for (let group of Object.keys(e.annotations[i])) {
              if (e.annotations[i][group].span[0] !== Number(i)) continue;
              cjIndices.push({
                document_id: e.document_id,
                docIndex,
                annotationIndex: e.annotations[i][group].span,
                group,
              });
            }
          }
        }
      }

      docIndex++;
    });
    return cjIndices;
  }

  async getJobAnnotations(codingjob) {
    let documents = await this.idb.documents.where("job_id").equals(codingjob.job_id);
    const annotations = [];
    await documents.each((e) => {
      if (e.annotations) {
        annotations.push(e.annotations);
      } else {
        annotations.push({});
      }
    });
    return annotations;
  }

  async getJobDocumentCount(codingjob) {
    return this.idb.documents.where("job_id").equals(codingjob.job_id).count();
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
  async renameAnnotations(codingjob, oldCode, newCode) {
    let ids = new Set(
      await this.idb.documents.where("job_id").equals(codingjob.job_id).primaryKeys()
    );
    for (let id of ids) {
      let doc = await this.getDocument(id);

      for (let i of Object.keys(doc.annotations)) {
        if (doc.annotations[i][oldCode]) {
          doc.annotations[i][newCode] = doc.annotations[i][oldCode];
          delete doc.annotations[i][oldCode];
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
