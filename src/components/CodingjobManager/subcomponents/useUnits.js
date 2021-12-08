import db from "apis/dexie";
import { useEffect, useState } from "react";
import { drawRandom } from "library/sample";

/**
 * Hook for getting the Units (using the current codingjob settings)
 * @param {} codingjob
 * @returns
 */
const useUnits = (codingjob) => {
  const [unitData, setUnitData] = useState(null);
  const [sample, setSample] = useState(null);
  const [loading, setLoading] = useState("ready");

  useEffect(() => {
    // if settings for preparing units change
    setLoading("loading");
    if (!codingjob?.unitSettings?.textUnit) return;
    getUnitData(codingjob.job_id, setUnitData);
    //setLoading(false);
  }, [
    codingjob?.unitSettings?.textUnit,
    codingjob?.unitSettings?.unitSelection,
    codingjob?.unitSettings?.annotation,
    codingjob.job_id,
    setUnitData,
  ]);

  useEffect(() => {
    // if settings for drawing sample change
    if (!unitData || !codingjob?.importedCodes) return;
    setLoading((state) => (state === "loading" ? "loading" : "awaiting_input"));

    const timer = setTimeout(() => {
      setLoading((state) => (state === "loading" ? null : "loading"));
      getSample(codingjob, unitData, setSample, setLoading);
    }, 1000);
    return () => clearTimeout(timer);
  }, [unitData, codingjob, setSample, setLoading]);

  if (!codingjob) return null;

  return [sample, loading];
};

const getUnitData = async (job_id, setUnitData) => {
  const unitSettings = await db.getCodingjobProp(job_id, "unitSettings");
  let unitData = await getUnitDataFromDB(job_id, unitSettings);
  setUnitData(unitData);

  await db.setCodingjobProp(job_id, "unitSettings", {
    ...unitSettings,
    n: unitData.units.length,
    totalUnits: unitData.units.length,
  });
};

const getSample = async (codingjob, unitData, setSample, setLoading) => {
  const validCodes = codingjob.unitSettings.validCodes[codingjob.unitSettings.annotation];

  let units = unitData.units;
  let invalidCodesLookup = {};
  if (
    validCodes &&
    codingjob.unitSettings.unitSelection === "annotations" &&
    validCodes.some((vc) => !vc.valid)
  ) {
    invalidCodesLookup = validCodes.reduce((obj, code) => {
      if (!code.valid) obj[code.code] = true;
      return obj;
    }, {});
    units = units.filter((u) => !invalidCodesLookup[u.annotationValue]);
  }

  const nDiff = units.length - codingjob.unitSettings.totalUnits;
  if (nDiff !== 0) {
    await db.setCodingjobProp(codingjob, "unitSettings", {
      ...codingjob.unitSettings,
      n: Math.max(0, Math.min(units.length, codingjob.unitSettings.n + nDiff)),
      totalUnits: units.length,
    });
    if (units.length === 0) {
      setSample([]);
      setTimeout(() => setLoading("ready"), 50);
    }
    return;
  }

  let stratum = units.map((u) => {
    let s = codingjob.unitSettings.balanceDocuments ? u.doc_uid : "";
    if (unitData.unitSelection === "annotations" && codingjob.unitSettings.balanceAnnotations)
      s += `_${u.annotationValue}`;
    return s;
  });

  let sample = drawRandom(
    units,
    codingjob.unitSettings.n,
    false,
    codingjob.unitSettings.seed,
    stratum
  );

  if (
    unitData.unitSelection === "annotations" &&
    unitData.textUnit !== "span" &&
    codingjob.unitSettings.annotationMix
  ) {
    let sampleN = Math.ceil(units.length * (codingjob.unitSettings.annotationMix / 100));
    let randomUnits = getRandomUnits(
      unitData.all,
      codingjob,
      codingjob.unitSettings,
      sampleN,
      invalidCodesLookup
    );
    if (randomUnits.length > 0) {
      sample = sample.concat(randomUnits);
      sample = drawRandom(sample, sample.length, false, codingjob.unitSettings.seed, null);
    }
  }

  sample = orderUnits(sample, codingjob.unitSettings);
  setSample(sample);
  setTimeout(() => setLoading("ready"), 50);
};

const getUnitDataFromDB = async (job_id, unitSettings) => {
  const [all, annotations] = await getAllUnits(job_id, unitSettings);

  let units;
  if (unitSettings.unitSelection === "allTextUnits") units = all;
  if (unitSettings.unitSelection === "annotations") units = annotations;

  // returns both 'all' and 'annotations'. If selection is "allTextUnits", we use all,
  // and if it's "annotations" we use annotations. But if it's annotations + random we need both
  return {
    all,
    annotations,
    units,
    unitSelection: unitSettings.unitSelection,
    textUnit: unitSettings.textUnit,
    annotation: unitSettings.annotation,
  };
};

const getAllUnits = async (job_id, unitSettings) => {
  const { textUnit, unitSelection } = unitSettings;

  let documents = await db.getDocuments(job_id);

  // doesn't do anything right now, but maybe make settings at some point
  let minIndex = 0;
  let maxIndex = Infinity;

  const annotatedUnits = [];
  const allUnits = [];

  let docIndex = -1;
  await documents.each((e) => {
    docIndex++;
    const unitIndices = [];
    const annotationValues =
      unitSelection === "annotations"
        ? getAnnotations(e.annotations, e.tokens, textUnit, unitSettings.annotation)
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
        docIndex,
        annotationValues: {},
      };

      if (annotationValues[unitIndex]) {
        for (let ann of annotationValues[unitIndex]) {
          const annItem = { ...item };
          annItem.variables = ann.variables;
          annItem.span = ann.span;
          annItem.annotationValue = ann.annotationValue;
          if (textUnit === "span") item.unitIndex = ann.span[0];
          annotatedUnits.push(annItem);
          item.annotationValues[ann.annotationValue] = true;
        }
      }

      if (textUnit !== "span") allUnits.push(item);
    }
  });

  return [allUnits, annotatedUnits];
};

const getRandomUnits = (all, codingjob, unitSettings, sampleN, invalidCodesLookup) => {
  const variable = unitSettings.annotation;
  const codes = codingjob.importedCodes[variable];

  let indices = [];
  for (let i = 0; i < all.length; i++) {
    const unit = all[i];
    for (let code of codes) {
      if (invalidCodesLookup[code.code]) continue;
      const value = code.code; // if at some point we decide to allow multiple values, id will be more complicated

      if (unitSettings.onlyUnused && unit.annotationValues[value]) continue;
      indices.push({
        i,
        variables: { [variable]: code.code },
        stratum: unit.stratum + `_${value}`,
      });
    }
  }

  if (indices.length === 0) return [];
  indices = drawRandom(
    indices,
    sampleN,
    false,
    unitSettings.seed + 1,
    indices.map((i) => i.stratum)
  );

  const randomUnits = [];
  for (let randomUnitIndex of indices) {
    randomUnits.push({
      ...all[randomUnitIndex.i],
      random: true,
      variables: randomUnitIndex.variables,
    });
  }
  return randomUnits;
};

const getAnnotations = (annotations, tokens, textUnit, annotation) => {
  // complicated story... but.
  // creates an object to add all used values for the selected annotation to the units
  // this is used for adding random annotations without accidentally random sampling a
  // correct annotation (which in some cases is quite common)
  if (!annotations) return [];
  const ann = {};
  for (let i of Object.keys(annotations)) {
    for (let variable of Object.keys(annotations[i])) {
      if (variable !== annotation) continue;
      const annotationValue = annotations[i][variable].value;

      const a = {
        annotationValue,
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
  if (unitSettings.unitSelection === "annotations" && unitSettings.annotationMix > 0)
    return cjIndices;
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
