import hash from "object-hash";
import { importTokens, importTokenAnnotations, parseTokens } from "util/tokens";
import { importSpanAnnotations } from "util/annotations";

/**
 * Prepares a batch of documents. Returns [documents, codes], where codes contains the annotation codes used in the documents
 *
 * @param {*} documentList an Array with documents
 * @param {*} existingUids An (optional) array of existing unique (hash-based) ids, to ignore duplicate articles
 * @param {*} job_id       A unique job_id for which the document is intended. If not given, assumes it's a temp document (that won't be stored in indexedDB)
 * @param {*} silent       Whether or not to report if items have been created
 */
export const prepareDocumentBatch = (
  documentList,
  existingUids = [],
  job_id = "TEMP",
  silent = true
) => {
  let ids = new Set(existingUids);

  let duplicates = 0;
  let codes = {};
  const preparedDocuments = documentList.reduce((result, document) => {
    const doc_uid = hash([document, job_id]); // codingjob included for doc_uid (unique id) hash
    if (!ids.has(doc_uid)) {
      ids.add(doc_uid);

      result.push({
        doc_uid: doc_uid,
        job_id: job_id,
        ...prepareDocument(document, codes),
      });
    } else {
      duplicates++;
    }
    return result;
  }, []);

  if (!silent) {
    let message = `Created ${documentList.length - duplicates} new documents.`;
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

  return [preparedDocuments, codes];
};

export const prepareDocument = (document, codes = {}) => {
  const doc = { ...document };

  if (doc.tokens) {
    doc.tokens = importTokens(document.tokens);
  } else {
    if (!doc.text_fields && doc.text) doc.text_fields = [{ name: "text", value: doc.text }];
    doc.tokens = parseTokens([...doc.text_fields]);
  }
  if (doc.tokens.length > 0) {
    doc.n_paragraphs = doc.tokens[doc.tokens.length - 1].paragraph;
    doc.n_sentences = doc.tokens[doc.tokens.length - 1].sentence;
  } else {
    doc.n_paragraphs = 0;
    doc.n_sentences = 0;
  }

  if (doc.annotations) {
    doc.annotations = importSpanAnnotations([...doc.annotations], doc.tokens);
  } else doc.annotations = {};

  const tokenAnnotations = importTokenAnnotations(doc.tokens, codes); // also fills codes
  if (tokenAnnotations.length > 0)
    doc.annotations.span = importSpanAnnotations(tokenAnnotations, doc.tokens, doc.annotations);

  return doc;
};
