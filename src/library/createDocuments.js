import hash from "object-hash";
import { importTokens, importTokenAnnotations, parseTokens } from "library/tokens";
import { importSpanAnnotations } from "library/annotations";

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
    if (document.document_id == null) return result;
    const doc_uid = hash([document, job_id]); // codingjob included for doc_uid (unique id) hash
    if (!ids.has(doc_uid)) {
      ids.add(doc_uid);

      const preparedDoc = prepareDocument(document, codes); // the codes  are filled within
      if (preparedDoc.tokens.length === 0) return result;

      result.push({
        doc_uid: doc_uid,
        job_id: job_id,
        ...preparedDoc,
      });
    } else {
      duplicates++;
    }
    return result;
  }, []);

  if (!silent) {
    let message = `Created ${preparedDocuments.length} new documents.`;
    if (duplicates > 0) message = message + ` Ignored ${duplicates} duplicates`;
    alert(message);
  }

  return [preparedDocuments, codes];
};

export const prepareDocument = (document, codes = {}) => {
  const doc = { ...document };

  if (doc.tokens) {
    doc.importedTokens = true;
    doc.tokens = importTokens(document.tokens);
  } else {
    doc.importedTokens = false;
    if (!doc.text_fields && doc.text) doc.text_fields = [{ name: "text", value: doc.text }];
    doc.tokens = parseTokens([...doc.text_fields]);
  }

  doc.meta_fields = document.meta_fields || [];

  if (doc.tokens.length > 0) {
    doc.n_paragraphs = doc.tokens[doc.tokens.length - 1].paragraph;
    doc.n_sentences = doc.tokens[doc.tokens.length - 1].sentence;
  } else {
    doc.n_paragraphs = 0;
    doc.n_sentences = 0;
  }

  // ImportSpanAnnotations transforms the array format annotations to an object format.
  // More importantly, it matches the annotations to token indices (based on the char offset)
  if (doc.annotations) {
    doc.annotations = importSpanAnnotations([...doc.annotations], doc.tokens);
  } else doc.annotations = {};

  const tokenAnnotations = importTokenAnnotations(doc.tokens, codes); // also fills codes
  if (tokenAnnotations.length > 0)
    doc.annotations = importSpanAnnotations(tokenAnnotations, doc.tokens, doc.annotations);

  return doc;
};