import { selectTokens } from "./selectTokens";
import hash from "object-hash";
import db from "apis/dexie";
import { exportSpanAnnotations } from "ccs-annotator-client";

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
  const { contextUnit, contextWindow, layout } = codingjob.unitSettings;

  const docs = {};
  const standardizedUnits = [];

  const jobhash = hash(codingjob);

  for (let i = 0; i < units.length; i++) {
    const doc_uid = units[i].doc_uid;
    if (!docs[doc_uid]) docs[doc_uid] = await db.getDocument(doc_uid);

    // get the unit tokens (filter the document tokens, and add bool for whether token is codingunit (i.e. not context))
    let tokens = selectTokens(docs[doc_uid].tokens, units[i], contextUnit, contextWindow);

    const codingUnit = tokens.map((token) => token.codingUnit);
    const firstUnitIndex = codingUnit.indexOf(true);
    const lastUnitIndex = codingUnit.lastIndexOf(true);
    const fromChar = tokens[firstUnitIndex].offset;
    const toChar = tokens[lastUnitIndex].offset + tokens[lastUnitIndex].length;

    // get annotations, transform back to array format, and filter for selected tokens
    const docAnnotations = exportSpanAnnotations(docs[doc_uid].annotations, docs[doc_uid].tokens);
    const importedAnnotations = docAnnotations.filter(
      (a) => a.offset >= fromChar && a.offset < toChar
    );

    const unit = {
      document_id: units[i].document_id,
      provenance: { unit: units[i].textUnit, unit_index: units[i].unitIndex },
      meta_fields: docs[doc_uid].meta_fields,
      importedAnnotations,
      variables: units[i].variables,
    };

    // disabled for now, because AmCAT only allows small file uploads
    const useOwnTokens = false; // docs[doc_uid].importedTokens
    if (useOwnTokens) {
      // if tokens were imported, don't collapse to texts, but keep the original tokens.
      unit.tokens = tokensRowToColumn(tokens);

      const keepColumns = [
        "document_id",
        "codingUnit",
        "offset",
        "length",
        "pre",
        "post",
        "paragraph",
        "sentence",
        "section",
        "text",
      ];
      unit.tokens = Object.keys(unit.tokens).reduce((data, column) => {
        if (keepColumns.includes(column)) data[column] = unit.tokens[column];
        return data;
      }, {});
      unit.text_fields = Object.keys(layout.text).reduce((tf, name) => {
        // if texts are not collapsed, text_fields is still used for section layout settings
        tf.push({ name, ...layout.text[name] });
        return tf;
      }, []);
    } else {
      unit.text_fields = unparseTokens(tokens);
      unit.text_fields = unit.text_fields.map((tf) => ({ ...tf, ...layout.text[tf.name] }));
    }

    unit.meta_fields = unit.meta_fields.map((mf) => ({ ...mf, ...layout.meta[mf.name] }));
    unit.unit_id = hash({ jobhash, unit, date: Date() });
    standardizedUnits.push(unit);
  }
  return standardizedUnits;
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

/**
 * Check if tokens are in row format
 *  {doc_id: 1, token_id: 1}, {doc_id: 2, token_id: 2}
 * and if so, change to column format
 *  [{doc_id: [1,1,1,1,...]},{token_id: [1,2,3,4,etc.]}]
 *
 * row format is easier to work with, but column format is more efficient
 * @param {} tokens
 */
export const tokensRowToColumn = (tokens) => {
  if (!Array.isArray(tokens)) return tokens;

  const tokensObj = {};
  for (let token of tokens) {
    for (let column of Object.keys(token)) {
      if (!tokensObj[column]) tokensObj[column] = [];
      tokensObj[column].push(token[column]);
    }
  }

  return tokensObj;
};
