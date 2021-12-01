import db from "apis/dexie";
import { useEffect, useState } from "react";
import { drawRandom } from "library/sample";

/**
 * Hook for getting the Units (using the current codingjob settings)
 * @param {} codingjob
 * @returns
 */
const useUnits = (codingjob) => {
  const [units, setUnits] = useState(null);

  // When a new codingjob is loaded, set codingjobLoaded ref to false
  // this prevents actually loading the data until unitSettings has loaded
  // the unitSettings stored in the codingjob

  useEffect(() => {
    if (!codingjob?.unitSettings) return null;
    //setUnits(null);
    getUnits(codingjob, setUnits);
  }, [codingjob, setUnits]);

  if (!codingjob) return null;

  return units;
};

const getUnits = async (codingjob, setUnits) => {
  let [totalUnits, units] = await getUnitsFromDB(codingjob);
  setUnits(units);

  if (
    codingjob.unitSettings.n === null ||
    codingjob.unitSettings.n == null ||
    codingjob.unitSettings.totalUnits !== totalUnits
  ) {
    await db.setCodingjobProp(codingjob, "unitSettings", {
      ...codingjob.unitSettings,
      n: totalUnits,
      totalUnits,
    });
  }
};

const getUnitsFromDB = async (codingjob) => {
  if (!codingjob?.unitSettings) return null;
  const unitSettings = codingjob.unitSettings;

  let cjIndices;
  const [all, annotations] = await getAllUnits(codingjob, unitSettings);
  if (unitSettings.unitSelection === "allTextUnits") cjIndices = all;
  if (unitSettings.unitSelection === "annotations") cjIndices = annotations;
  const totalUnits = cjIndices.length;

  cjIndices = drawRandom(
    cjIndices,
    unitSettings.n,
    false,
    unitSettings.seed,
    cjIndices.map((i) => i.stratum)
  );

  if (
    unitSettings.unitSelection === "annotations" &&
    unitSettings.textUnit !== "span" &&
    unitSettings.annotationMix
  ) {
    let sampleN = Math.ceil(cjIndices.length * (unitSettings.annotationMix / 100));
    let fakeUnits = getFakeUnits(all, codingjob, unitSettings, sampleN);
    if (fakeUnits.length > 0) cjIndices = cjIndices.concat(fakeUnits);
  }

  cjIndices = orderUnits(cjIndices, unitSettings);
  return [totalUnits, cjIndices];
};

const getAllUnits = async (codingjob, unitSettings) => {
  const { textUnit, unitSelection, balanceDocuments, balanceAnnotations } = unitSettings;

  let documents = await db.getDocuments(codingjob);

  let minIndex = 0;
  let maxIndex = Infinity;
  if (codingjob.unitSettings.useIndexWindow) {
    minIndex = codingjob.unitSettings.indexWindow[0];
    maxIndex = codingjob.unitSettings.indexWindow[1];
  }

  const annotatedUnits = [];
  const allUnits = [];

  let docIndex = -1;
  await documents.each((e) => {
    docIndex++;
    const unitIndices = [];
    const annotationValues =
      unitSelection === "annotations"
        ? getAnnotations(e.annotations, e.tokens, textUnit, codingjob.unitSettings.annotation)
        : [];

    if (textUnit === "document" || textUnit === "span") {
      unitIndices.push(0);
    }

    if (textUnit === "paragraph") {
      const paragraphs = e.tokens[e.tokens.length - 1].paragraph;
      for (let parIndex = minIndex; parIndex <= Math.min(maxIndex, paragraphs); parIndex++) {
        unitIndices.push(parIndex);
      }
    }

    if (textUnit === "sentence") {
      const sentences = e.tokens[e.tokens.length - 1].sentence;
      for (let sentIndex = minIndex; sentIndex <= Math.min(maxIndex, sentences); sentIndex++) {
        unitIndices.push(sentIndex);
      }
    }

    for (let unitIndex of unitIndices) {
      const item = {
        textUnit,
        unitIndex: unitIndex,
        doc_uid: e.doc_uid,
        document_id: e.document_id,
        textFields: getTextFields(e),
        metaFields: getMetaFields(e),
        stratum: balanceDocuments ? e.doc_uid : "",
        docIndex,
        annotationIds: {},
      };

      if (annotationValues[unitIndex]) {
        for (let ann of annotationValues[unitIndex]) {
          const annItem = { ...item };
          annItem.variables = ann.variables;
          annItem.span = ann.span;
          //if (textUnit === 'span') item.unitIndex = ann.span[0]
          if (balanceAnnotations) annItem.stratum += `_${ann.id}`;
          annotatedUnits.push(annItem);
          item.annotationIds[ann.id] = true;
        }
      }

      if (textUnit !== "span") allUnits.push(item);
    }
  });

  return [allUnits, annotatedUnits];
};

const getFakeUnits = (all, codingjob, unitSettings, sampleN) => {
  const variable = unitSettings.annotation;
  const codes = codingjob.importedCodes[variable];

  let indices = [];
  for (let i = 0; i < all.length; i++) {
    const unit = all[i];
    for (let code of codes) {
      const id = code.code; // if at some point we decide to allow multiple values, id will be more complicated

      if (!unit.annotationIds[id]) {
        indices.push({
          i,
          variables: { [variable]: code.code },
          stratum: unit.stratum + `_${id}`,
        });
      }
    }
  }

  if (indices.length === 0) return [];
  indices = drawRandom(
    indices,
    sampleN,
    false,
    unitSettings.seed,
    indices.map((i) => i.stratum)
  );

  const fakeUnits = [];
  for (let fakeUnitIndex of indices) {
    fakeUnits.push({
      ...all[fakeUnitIndex.i],
      fake: true,
      variables: fakeUnitIndex.variables,
    });
  }
  return fakeUnits;
};

const getAnnotations = (annotations, tokens, textUnit, annotation) => {
  // complicated story... but.
  // creates an object to add all used values for the selected annotation to the units
  // this is used for adding fake annotations without accidentally random sampling a
  // correct annotation (which in some cases is quite common)
  if (!annotations) return [];
  const ann = {};
  for (let i of Object.keys(annotations)) {
    for (let variable of Object.keys(annotations[i])) {
      if (variable !== annotation) continue;
      const id = annotations[i][variable].value;

      const a = {
        id,
        //unitIndex: Number(i),
        span: annotations[i][variable].span,
        variables: { [variable]: annotations[i][variable].value },
      };

      if (textUnit === "document" || textUnit === "span") {
        if (!ann[0]) ann[0] = [];
        ann[0].push(a);
      }
      if (textUnit === "paragraph") {
        if (!ann[tokens[i].paragraph]) ann[tokens[i].paragraph] = [];
        ann[tokens[i].paragraph].push(a);
      }
      if (textUnit === "sentence") {
        if (!ann[tokens[i].sentence]) ann[tokens[i].sentence] = [];
        ann[tokens[i].sentence].push(a);
      }
    }
  }
  return ann;
};

const getTextFields = (e) => {
  if (e.text_fields) return e.text_fields.map((tf) => tf.name);
  if (e.tokens) {
    const fields = new Set();
    for (let token of e.tokens) fields.add(token.section);
    return [...fields];
  }
  return [];
};

const getMetaFields = (e) => {
  if (e.meta_fields) return e.meta_fields.map((tf) => tf.name);
  return [];
};

const orderUnits = (cjIndices, unitSettings) => {
  if (!unitSettings.ordered) return cjIndices;
  return cjIndices.sort(function (a, b) {
    if (a.docIndex !== b.docIndex) return a.docIndex - b.docIndex;
    if (a.unitIndex !== b.unitIndex) return a.unitIndex - b.unitIndex;
    if (a.annotation != null && a.annotation.index !== b)
      return a.annotation.index - b.annotation.index;
    return 0;
  });
};

export default useUnits;
