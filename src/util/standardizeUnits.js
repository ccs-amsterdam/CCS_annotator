import { selectTokens } from "./selectTokens";
import hash from "object-hash";
import db from "apis/dexie";
import { exportSpanAnnotations } from "./annotations";

// Transform an item as its created in codingjob manager into a simpler
// standardized item format. This is used when codingjobs are deployed,
// but also per item in the previews. This looks redundant (tokens are
// transformed to text, only to get tokenized immediately after), but this
// makes it much easier to understand whats happening.
// Basically:
//   - When documents are uploaded they are tokenized
//   - Unit selection can split documens into coding units (and context units)
//   - These units are transformed to simplified items

export const standardizeUnits = async (codingjob, units) => {
  const { contextUnit, contextWindow } = codingjob.unitSettings;

  const docs = {};
  const items = [];

  const jobhash = hash(codingjob);

  for (let i = 0; i < units.length; i++) {
    const doc_uid = units[i].doc_uid;
    if (!docs[doc_uid]) docs[doc_uid] = await db.getDocument(doc_uid);

    // get the unit tokens (filter the document tokens, and add bool for whether token is codingunit (i.e. not context))
    const tokens = selectTokens(docs[doc_uid].tokens, units[i], contextUnit, contextWindow);

    // get annotations and filter for selected tokens
    const docAnnotations = exportSpanAnnotations(docs[doc_uid].annotations, docs[doc_uid].tokens);
    const codingUnit = tokens.map((token) => token.codingUnit);
    const firstUnitIndex = codingUnit.indexOf(true);
    const lastUnitIndex = codingUnit.lastIndexOf(true);
    const fromChar = tokens[firstUnitIndex].offset;
    const toChar = tokens[lastUnitIndex].offset + tokens[lastUnitIndex].length;
    const annotations = docAnnotations.filter((a) => a.offset >= fromChar && a.offset < toChar);

    const item = {
      document_id: units[i].document_id,
      meta: { unit: units[i].textUnit, unit_index: units[i].unitIndex },
      annotations,
      variables: units[i].variables,
    };

    if (docs[doc_uid].importedTokens) {
      item.tokens = tokens;
    } else {
      item.text_fields = unparseTokens(tokens);
    }

    item.unit_id = hash({ jobhash, item, date: Date() });
    items.push(item);
  }
  return items;
};

const unparseTokens = (tokens) => {
  // Create texts from tokens in a way that preserves information about original text and textParts (context and unit)

  const text_fields = [];
  if (tokens.length === 0) return text_fields;

  let unit_start = null;
  let unit_end = null;
  let text = "";
  let section = tokens[0].section;

  let offset = {};
  if (tokens[0].offset > 0) offset.offset = tokens[0].offset;

  let unit_started = false;
  let unit_ended = false;

  for (let token of tokens) {
    if (token.section !== section) {
      const text_field = { name: section, value: text, ...offset };
      if (unit_start !== null) text_field.unit_start = unit_start;
      if (unit_end !== null) text_field.unit_end = unit_end;

      text_fields.push(text_field);

      offset = {};
      if (token.offset > 0) offset.offset = token.offset;

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
    const text_field = { name: section, value: text, ...offset };
    if (unit_start !== null) text_field.unit_start = unit_start;
    if (unit_end !== null) text_field.unit_end = unit_end;
    text_fields.push(text_field);
  }
  return text_fields;
};
