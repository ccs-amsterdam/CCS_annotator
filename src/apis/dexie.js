import Dexie from "dexie";
import hash from "object-hash";

import { drawRandom } from "util/sample";
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

  async getCodingjobItems(codingjob) {
    codingjob = await this.getCodingjob(codingjob);
    if (!codingjob?.codebook?.unitSettings) return null;
    const textUnit = codingjob.codebook.unitSettings.textUnit;
    const unitSelection = codingjob.codebook.unitSettings;

    let totalItems = 0;

    const getGroup = (cjIndices) => {
      if (!unitSelection.balanceDocuments && !unitSelection.statifyAnnotations) return null; // if not balanced

      return cjIndices.map((item) => {
        let group = "";
        if (unitSelection.balanceDocuments) group += item.docIndex;
        if (item.annotation && unitSelection.balanceAnnotations)
          group += "_" + item.annotation.group;
        return group;
      });
    };

    let cjIndices;
    let done;

    if (unitSelection.value === "all") {
      cjIndices = await allJobItems(codingjob, textUnit, new Set([]), true);
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
      // The annotation options are 'per annotation' and 'has annotation'.
      // The latter is currently not used, but leaving it here for now
      // THe difference is that 'has annotations' gives unique text units with at least one annotation
      [cjIndices, done] = await annotationJobItems(
        codingjob,
        textUnit,
        unitSelection.value === "has annotation",
        unitSelection.validCodes
      );
      totalItems = cjIndices.length;
      cjIndices = drawRandom(
        cjIndices,
        unitSelection.n,
        false,
        unitSelection.seed,
        getGroup(cjIndices)
      );

      if (unitSelection.annotationMix && unitSelection.annotationMix > 0) {
        // Annotationmix is now disabled, but leaving it here because it might make a comeback someday
        const noDuplicates = unitSelection.value === "has annotation";

        const all = await allJobItems(codingjob, textUnit, done, noDuplicates);
        console.log(all);
        let sampleN = Math.ceil(cjIndices.length * (unitSelection.annotationMix / 100));
        let addSample = drawRandom(
          all,
          sampleN,
          !noDuplicates,
          unitSelection.seed,
          getGroup(cjIndices)
        );

        let nCodes = unitSelection.validCodes.length;
        addSample = addSample.map((item, i) => {
          // add random annotation to mix by drawing from the annotations in the cjIndices sample.
          // this is random, and automatically gives approximately the same distribution of codes/groups
          if (unitSelection.balanceAnnotations) {
            item.group = unitSelection.validCodes[i % nCodes];
          } else {
            const annSample = cjIndices[i % cjIndices.length];
            if (annSample?.group) item.group = annSample.group;
          }
          item.annotation = { i, group: item.group };
          return { ...item };
        });
        cjIndices = cjIndices.concat(addSample);
      }
    }

    cjIndices = orderJobItems(cjIndices, unitSelection);

    return [totalItems, cjIndices];
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

const allJobItems = async (codingjob, textUnit, done, noDuplicates) => {
  let documents = await db.getDocuments(codingjob);

  const cjIndices = [];
  let docIndex = -1;
  await documents.each((e) => {
    docIndex++;
    if (textUnit === "document" && !done.has(e.doc_uid)) {
      if (noDuplicates && done.has(e.doc_uid)) return;
      cjIndices.push({
        textUnit,
        unitIndex: 0, // this is for consistency with paragraph and sentence
        doc_uid: e.doc_uid,
        document_id: e.document_id,
        docIndex,
      });
    }

    if (textUnit === "paragraph") {
      const paragraphs = e.tokens[e.tokens.length - 1].paragraph;
      for (let parIndex = 0; parIndex <= paragraphs; parIndex++) {
        if (noDuplicates && done.has(e.doc_uid + "_" + parIndex)) return;
        cjIndices.push({
          textUnit,
          unitIndex: parIndex,
          doc_uid: e.doc_uid,
          document_id: e.document_id,
          docIndex,
          //parIndex,
        });
      }
    }

    if (textUnit === "sentence") {
      const sentences = e.tokens[e.tokens.length - 1].sentence;
      for (let sentIndex = 0; sentIndex <= sentences; sentIndex++) {
        if (noDuplicates && done.has(e.doc_uid + "_" + sentIndex)) return;
        cjIndices.push({
          textUnit,
          unitIndex: sentIndex,
          doc_uid: e.doc_uid,
          document_id: e.document_id,
          docIndex,
          //sentIndex,
        });
      }
    }
  });
  return cjIndices;
};

const annotationJobItems = async (codingjob, textUnit, unique, validCodes) => {
  let documents = await db.getDocuments(codingjob);

  let useCode = null;
  if (validCodes)
    useCode = validCodes.reduce((obj, code) => {
      obj[code] = true;
      return obj;
    }, {});

  const cjIndices = [];
  const done = new Set([]);
  let docIndex = -1;
  await documents.each((e) => {
    docIndex++;
    if (e.annotations?.span) {
      for (let i of Object.keys(e.annotations.span)) {
        for (let group of Object.keys(e.annotations.span[i])) {
          const span = e.annotations.span[i][group].span;
          if (i > span[0]) {
            if (textUnit === "document") continue;
            if (textUnit === "span") continue;
            // an annotation can cover multiple units, and each unit should only be included once
            if (textUnit === "paragraph" && e.tokens[i].paragraph === e.tokens[i - 1].paragraph)
              continue;
            if (textUnit === "sentence" && e.tokens[i].sentence === e.tokens[i - 1].sentence)
              continue;
          }

          if (useCode && useCode[group] == null) continue;

          const item = {
            textUnit,
            doc_uid: e.doc_uid,
            document_id: e.document_id,
            docIndex,
            group,
          };
          //if (textUnit === "paragraph") item.parIndex = e.tokens[Number(i)].paragraph;
          //if (textUnit === "sentence") item.sentIndex = e.tokens[Number(i)].sentence;
          if (textUnit === "document" || textUnit === "span") item.unitIndex = Number(i);
          if (textUnit === "paragraph") item.unitIndex = e.tokens[Number(i)].paragraph;
          if (textUnit === "sentence") item.unitIndex = e.tokens[Number(i)].sentence;

          if (unique) {
            let itemId = item.doc_uid + "_" + item.textUnit + "_" + item.unitIndex;
            // if (textUnit === "document") itemId = item.doc_uid;
            // if (textUnit === "paragraph") itemId = item.doc_uid + "_" + item.parIndex;
            // if (textUnit === "sentence") itemId = item.doc_uid + "_" + item.sentIndex;
            if (done.has(itemId)) continue;
            done.add(itemId);
          } else {
            item.annotation = { ...e.annotations.span[i][group], group };
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
  return cjIndices.sort(function (a, b) {
    if (a.docIndex !== b.docIndex) return a.docIndex - b.docIndex;
    if (a.unitIndex !== b.unitIndex) return a.unitIndex - b.unitIndex;
    if (a.annotation != null && a.annotation.index !== b)
      return a.annotation.index - b.annotation.index;
    return 0;
  });
};

const db = new AnnotationDB();
export default db;
