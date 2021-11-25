import db from "apis/dexie";
import { useEffect, useState } from "react";
import { drawRandom } from "util/sample";

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
    setUnits(null);
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
  const textUnit = codingjob.unitSettings.textUnit;
  const unitSettings = codingjob.unitSettings;

  let totalUnits = 0;

  const getGroup = (cjIndices) => {
    if (!unitSettings.balanceDocuments && !unitSettings.statifyAnnotations) return null; // if not balanced

    return cjIndices.map((item) => {
      let group = "";
      if (unitSettings.balanceDocuments) group += item.docIndex;
      if (item.annotation && unitSettings.balanceAnnotations)
        group += "_" + item.annotation.variable;
      return group;
    });
  };

  let cjIndices;
  let done;

  if (unitSettings.unitSelection === "allTextUnits") {
    cjIndices = await allUnits(codingjob, textUnit, new Set([]), true);
    totalUnits = cjIndices.length;
    cjIndices = drawRandom(
      cjIndices,
      unitSettings.n,
      false,
      unitSettings.seed,
      getGroup(cjIndices)
    );
  }

  if (unitSettings.unitSelection === "annotations") {
    [cjIndices, done] = await annotationUnits(codingjob, textUnit, false, unitSettings.validCodes);

    totalUnits = cjIndices.length;
    cjIndices = drawRandom(
      cjIndices,
      unitSettings.n,
      false,
      unitSettings.seed,
      getGroup(cjIndices)
    );

    if (unitSettings.annotationMix && unitSettings.annotationMix > 0) {
      // Annotationmix is now disabled, but leaving it here because it might make a comeback someday
      const noDuplicates = false;

      const all = await allUnits(codingjob, textUnit, done, noDuplicates);
      let sampleN = Math.ceil(cjIndices.length * (unitSettings.annotationMix / 100));
      let addSample = drawRandom(
        all,
        sampleN,
        !noDuplicates,
        unitSettings.seed,
        getGroup(cjIndices)
      );

      let nCodes = unitSettings.validCodes.length;
      addSample = addSample.map((item, i) => {
        // add random annotation to mix by drawing from the annotations in the cjIndices sample.
        // this is random, and automatically gives approximately the same distribution of codes
        let value;
        if (unitSettings.balanceAnnotations) {
          value = unitSettings.validCodes[i % nCodes];
        } else {
          const annSample = cjIndices[i % cjIndices.length];
          value = annSample.value;
          //if (annSample?.variable) item.variable = annSample.variable;
          //if (annSample?.value) item.value = annSample.value;
        }
        item.variables = { [unitSettings.annotation]: value };
        return { ...item };
      });
      cjIndices = cjIndices.concat(addSample);
    }
  }

  cjIndices = orderUnits(cjIndices, unitSettings);

  return [totalUnits, cjIndices];
};

const allUnits = async (codingjob, textUnit, done, noDuplicates) => {
  let documents = await db.getDocuments(codingjob);

  let minIndex = 0;
  let maxIndex = Infinity;
  if (codingjob.unitSettings.useIndexWindow) {
    minIndex = codingjob.unitSettings.indexWindow[0];
    maxIndex = codingjob.unitSettings.indexWindow[1];
  }

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
      for (let parIndex = minIndex; parIndex <= Math.min(maxIndex, paragraphs); parIndex++) {
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
      for (let sentIndex = minIndex; sentIndex <= Math.min(maxIndex, sentences); sentIndex++) {
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

const annotationUnits = async (codingjob, textUnit, unique, validCodes) => {
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
    if (e.annotations) {
      for (let i of Object.keys(e.annotations)) {
        for (let variable of Object.keys(e.annotations[i])) {
          if (variable !== codingjob.unitSettings.annotation) continue;
          const span = e.annotations[i][variable];
          if (i > span[0]) {
            if (textUnit === "document") continue;
            if (textUnit === "span") continue;
            // an annotation can cover multiple units, and each unit should only be included once
            if (textUnit === "paragraph" && e.tokens[i].paragraph === e.tokens[i - 1].paragraph)
              continue;
            if (textUnit === "sentence" && e.tokens[i].sentence === e.tokens[i - 1].sentence)
              continue;
          }

          if (useCode && useCode[variable] == null) continue;

          const item = {
            textUnit,
            doc_uid: e.doc_uid,
            document_id: e.document_id,
            docIndex,
            span: e.annotations[i][variable].span,
          };

          if (textUnit === "document" || textUnit === "span") item.unitIndex = Number(i);
          if (textUnit === "paragraph") item.unitIndex = e.tokens[Number(i)].paragraph;
          if (textUnit === "sentence") item.unitIndex = e.tokens[Number(i)].sentence;

          if (unique) {
            let itemId = item.doc_uid + "_" + item.textUnit + "_" + item.unitIndex;
            if (done.has(itemId)) continue;
            done.add(itemId);
          } else {
            item.variables = { [variable]: e.annotations[i][variable].value };
          }
          cjIndices.push(item);
        }
      }
    }
  });
  return [cjIndices, done];
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
