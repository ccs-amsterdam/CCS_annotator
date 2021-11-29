import { useState, useEffect } from "react";
import { prepareDocument } from "library/createDocuments";
import hash from "object-hash";

const useUnit = (unit, safetyCheck, returnTokens) => {
  const [preparedUnit, setPreparedUnit] = useState({});
  const [annotations, setAnnotations] = useState();

  useEffect(() => {
    if (!unit?.text && !unit.text_fields && !unit.tokens) return null;
    const document = prepareDocument(unit);
    safetyCheck.current = {
      tokens: document.tokens,
      annotationsChanged: false,
      annotations: hash(document.annotations),
    };
    setPreparedUnit({
      tokens: document.tokens,
      text_fields: document.text_fields,
      meta_fields: document.meta_fields,
    });
    setAnnotations(document.annotations);
    if (returnTokens) returnTokens(document.tokens);
  }, [unit, returnTokens, safetyCheck]);

  // if returnAnnotations is falsy (so not passed to Document), make setAnnotations
  // falsy as well. This is used further down as a sign that annotations are disabled
  return [preparedUnit, annotations, setAnnotations];
};

export default useUnit;
