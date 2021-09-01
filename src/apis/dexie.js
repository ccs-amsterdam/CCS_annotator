import Dexie from "dexie";
import hash from "object-hash";
import { importTokens, importTokenAnnotations, parseTokens } from "../util/tokens";
import { importSpanAnnotations } from "../util/annotations";
import { drawRandom } from "../util/sample";

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
    await this.idb.documents
      .where("job_id")
      .equals(codingjob.job_id)
      .delete();
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

    if (!append || !codebook.codes) {
      codebook.codes = codes;
    } else {
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
      await this.idb.documents
        .where("job_id")
        .equals(codingjob.job_id)
        .primaryKeys()
    );

    let duplicates = 0;
    let codes = {};
    const preparedDocuments = documentList.reduce((result, document) => {
      const doc_uid = hash([document, codingjob]); // codingjob included for doc_uid (unique id) hash
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
      if (codes[code].length === 1) {
        if (codes[code][0] !== "") a.push({ code, parent: codes[code][0], active: true });
      } else {
        for (let parent of codes[code]) {
          if (parent !== "") a.push({ code: `${code} (${parent})`, parent, active: true });
        }
      }
      return a;
    }, []);

    this.writeCodes(codingjob, codes, true);

    return this.idb.documents.bulkAdd(preparedDocuments);
  }

  async deleteDocuments(documents) {
    const documentIds = documents.map(document => document.doc_uid);
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

  async getCodingjobItems(codingjob, textUnit, unitSelection, codeMap) {
    let totalItems = 0;

    const getGroup = cjIndices => {
      if (!unitSelection.stratifyDocuments) return null; // if not stratified
      return cjIndices.map(i => i.docIndex);
      // Placeholder for stratified sampling
      // Should return a vector of the length of cjIndices with unique group ids
    };

    let cjIndices;
    let done;

    if (unitSelection.value === "all") {
      cjIndices = await allJobItems(codingjob, textUnit, new Set([]));
      totalItems = cjIndices.length;
      cjIndices = drawRandom(
        cjIndices,
        unitSelection.n,
        false,
        unitSelection.seed,
        getGroup(cjIndices)
      );
    }

    if (unitSelection.value.includes("annotation")) {
      [cjIndices, done] = await annotationJobItems(
        codingjob,
        textUnit,
        unitSelection.value === "has annotation",
        codeMap
      );
      totalItems = cjIndices.length;
      cjIndices = drawRandom(
        cjIndices,
        unitSelection.n,
        false,
        unitSelection.seed,
        getGroup(cjIndices)
      );

      if (unitSelection.annotationMix > 0) {
        const noDuplicates = unitSelection.value === "has annotation";

        const all = await allJobItems(codingjob, textUnit, noDuplicates ? done : new Set([]));
        let sampleN = Math.ceil(cjIndices.length * (unitSelection.annotationMix / 100));
        let addSample = drawRandom(
          all,
          sampleN,
          !noDuplicates,
          unitSelection.seed,
          getGroup(cjIndices)
        );
        cjIndices = cjIndices.concat(addSample);
      }
    }

    cjIndices = orderJobItems(cjIndices, unitSelection);

    return [totalItems, cjIndices];
  }

  async getJobDocumentCount(codingjob) {
    return this.idb.documents
      .where("job_id")
      .equals(codingjob.job_id)
      .count();
  }

  async getDocuments(codingjob) {
    return this.idb.documents.where("job_id").equals(codingjob.job_id);
  }

  async getDocument(doc_uid) {
    return this.idb.documents.get(doc_uid);
  }

  async writeTokens(document, tokens) {
    return this.idb.documents
      .where("doc_uid")
      .equals(document.doc_uid)
      .modify({ tokens: tokens });
  }

  async writeAnnotations(document, annotations) {
    return this.idb.documents
      .where("doc_uid")
      .equals(document.doc_uid)
      .modify({ annotations: annotations });
  }
  async renameAnnotations(codingjob, oldCode, newCode) {
    let ids = new Set(
      await this.idb.documents
        .where("job_id")
        .equals(codingjob.job_id)
        .primaryKeys()
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

const allJobItems = async (codingjob, textUnit, done) => {
  let documents = await db.getDocuments(codingjob);

  const cjIndices = [];
  let docIndex = -1;
  await documents.each(e => {
    docIndex++;
    if (textUnit === "document" && !done.has(e.doc_uid))
      cjIndices.push({ doc_uid: e.doc_uid, docIndex });

    if (textUnit === "paragraph") {
      const paragraphs = e.tokens[e.tokens.length - 1].paragraph;
      for (let parIndex = 0; parIndex <= paragraphs; parIndex++) {
        if (done.has(e.doc_uid + "_" + parIndex)) continue;
        cjIndices.push({
          textUnit,
          doc_uid: e.doc_uid,
          docIndex,
          parIndex,
        });
      }
    }

    if (textUnit === "sentence") {
      const sentences = e.tokens[e.tokens.length - 1].sentence;
      for (let sentIndex = 0; sentIndex <= sentences; sentIndex++) {
        if (done.has(e.doc_uid + "_" + sentIndex)) continue;
        cjIndices.push({
          textUnit,
          doc_uid: e.doc_uid,
          docIndex,
          sentIndex,
        });
      }
    }
  });
  return cjIndices;
};

const annotationJobItems = async (codingjob, textUnit, unique, codeMap) => {
  // need to get 'this' from class.
  // maybe just use db.
  let documents = await db.getDocuments(codingjob);

  const cjIndices = [];
  const done = new Set([]);
  let docIndex = -1;
  await documents.each(e => {
    docIndex++;
    if (e.annotations) {
      for (let i of Object.keys(e.annotations)) {
        for (let group of Object.keys(e.annotations[i])) {
          const span = e.annotations[i][group].span;
          if (i > span[0]) {
            // an annotation can cover multiple units, and each unit should only be included once
            if (textUnit === "document") continue;
            if (textUnit === "paragraph" && e.tokens[i].paragraph === e.tokens[i - 1].paragraph)
              continue;
            if (textUnit === "sentence" && e.tokens[i].sentence === e.tokens[i - 1].sentence)
              continue;
          }

          console.log(codeMap);

          if (codeMap && codeMap[group] != null) {
            if (codeMap[group].active === false || codeMap[group].activeParent === false) continue;
          }

          const item = {
            textUnit,
            doc_uid: e.doc_uid,
            docIndex,
            group,
          };
          if (textUnit === "paragraph") item.parIndex = e.tokens[Number(i)].paragraph;
          if (textUnit === "sentence") item.sentIndex = e.tokens[Number(i)].sentence;

          if (unique) {
            let itemId;
            if (textUnit === "document") itemId = item.doc_uid;
            if (textUnit === "paragraph") itemId = item.doc_uid + "_" + item.parIndex;
            if (textUnit === "sentence") itemId = item.doc_uid + "_" + item.sentIndex;
            if (done.has(itemId)) continue;
            done.add(itemId);
          } else {
            item.annotation = { ...e.annotations[i][group], group };
          }
          cjIndices.push(item);
        }
      }
    }
  });
  return [cjIndices, done];
};

const orderJobItems = (cjIndices, unitSelection) => {
  if (!unitSelection.ordered) return cjIndices;
  return cjIndices.sort(function(a, b) {
    if (a.docIndex !== b.docIndex) return a.docIndex - b.docIndex;
    if (a.parIndex != null && a.parIndex !== b.parIndex) return a.parIndex - b.parIndex;
    if (a.sentIndex != null && a.sentIndex !== b.sentIndex) return a.sentIndex - b.sentIndex;
    if (a.annotation != null && a.annotation.index !== b)
      return a.annotation.index - b.annotation.index;
    return 0;
  });
};

const db = new AnnotationDB();
export default db;
