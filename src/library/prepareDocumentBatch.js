import hash from "object-hash";
import { prepareDocument } from "react-ccs-annotator";

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
    const doc_uid = hash([document, job_id, new Date()]); // bit overkill, sure
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
