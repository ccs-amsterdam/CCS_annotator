import { importTokens, importTokenAnnotations, parseTokens } from "library/tokens";
import { importSpanAnnotations } from "library/annotations";

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
