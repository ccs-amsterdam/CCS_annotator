import { useState, useEffect } from "react";
import { prepareDocument } from "library/createDocuments";

const useUnit = (unit, safetyCheck, returnTokens, setCodeHistory) => {
  const [preparedUnit, setPreparedUnit] = useState({});
  const [annotations, setAnnotations] = useState();

  useEffect(() => {
    if (!unit?.text && !unit.text_fields && !unit.tokens) return null;

    // !!!!!!!!!!!!!!!!! this needs to happen only when annotation is new. So when status='new' or something.
    if (!unit.annotations) unit.annotations = [];
    if (unit.importedAnnotations)
      unit.annotations = unit.annotations.concat(unit.importedAnnotations);

    initializeCodeHistory(unit.annotations, setCodeHistory);

    const document = prepareDocument(unit);
    safetyCheck.current = {
      tokens: document.tokens,
      //annotationsChanged: false,
      //annotations: hash(document.annotations),
    };
    setPreparedUnit({
      tokens: document.tokens,
      text_fields: document.text_fields,
      meta_fields: document.meta_fields,
    });

    setAnnotations(document.annotations);
    if (returnTokens) returnTokens(document.tokens);
  }, [unit, returnTokens, safetyCheck, setCodeHistory]);

  // if returnAnnotations is falsy (so not passed to Document), make setAnnotations
  // falsy as well. This is used further down as a sign that annotations are disabled
  return [preparedUnit, annotations, setAnnotations];
};

const initializeCodeHistory = (annotations, setCodeHistory) => {
  const ch = {};
  for (let annotation of annotations) {
    if (!ch[annotation.variable]) ch[annotation.variable] = new Set();
    ch[annotation.variable].add(annotation.value);
  }
  for (let key of Object.keys(ch)) {
    ch[key] = [...ch[key]];
  }
  setCodeHistory(ch);
};

export default useUnit;
