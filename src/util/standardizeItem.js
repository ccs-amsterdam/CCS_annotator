import { exportSpanAnnotations } from "./annotations";
import { selectTokens } from "./selectTokens";
import db from "apis/dexie";

// Transform an item as its created in codingjob manager into a simpler
// standardized item format. This is used when codingjobs are deployed,
// but also per item in the previews. This looks redundant (tokens are
// transformed to text, only to get tokenized immediately after), but this
// makes it much easier to understand whats happening.
// Basically:
//   - When documents are uploaded they are tokenized
//   - Unit selection can split documens into coding units (and context units)
//   - These units are transformed to simplified items

export const standardizeItems = async (codingjob, jobItems) => {
  const { contextUnit, contextWindow } = codingjob.unitSettings;
  const importAnnotations = codingjob?.taskSettings?.importAnnotations;

  const docs = {};
  const items = [];

  for (let i = 0; i < jobItems.length; i++) {
    const doc_uid = jobItems[i].doc_uid;
    if (!docs[doc_uid]) docs[doc_uid] = await db.getDocument(doc_uid);

    const tokens = selectTokens(docs[doc_uid].tokens, jobItems[i], contextUnit, contextWindow);
    const item = { text_fields: unparseTokens(tokens) };

    if (importAnnotations) item.annotations = exportSpanAnnotations(item.annotations);
    items.push(item);
  }
  return items;
};

const unparseTokens = tokens => {
  // Create texts from tokens in a way that preserves information about original text and textParts (context and unit)

  const text_fields = [];

  let offset = tokens[0].offset;
  let unit_start = null;
  let unit_end = null;
  let text = "";
  let section = tokens[0].section;

  let unit_started = false;
  let unit_ended = false;

  for (let token of tokens) {
    if (token.section !== section) {
      const text_field = { name: section, value: text, offset };
      if (unit_start !== null) text_field.unit_start = unit_start;
      if (unit_end !== null) text_field.unit_end = unit_end;

      text_fields.push(text_field);
      offset = token.offset;
      unit_start = null;
      unit_end = null;
      text = "";
    }

    if (!unit_started && token.codingUnit) {
      unit_start = token.offset;
      unit_started = true;
    }
    if (unit_started && !unit_ended && !token.codingUnit) {
      unit_end = token.offset - 1;
      unit_ended = true;
    }

    text = text + token.pre + token.text + token.post;
    section = token.section;
  }
  if (text.length > 0) {
    const text_field = { name: section, value: text, offset };
    if (unit_start !== null) text_field.unit_start = unit_start;
    if (unit_end !== null) text_field.unit_end = unit_end;
    text_fields.push(text_field);
  }
  return text_fields;
};
