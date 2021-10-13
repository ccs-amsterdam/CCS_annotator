import { useState, useEffect } from "react";
import { prepareDocument } from "util/createDocuments";

const useUnit = (unit, returnTokens) => {
  const [tokens, setTokens] = useState();
  const [annotations, setAnnotations] = useState();

  useEffect(() => {
    if (!unit?.text && !unit.text_fields) return null;
    const document = prepareDocument(unit);
    setTokens(document.tokens);
    setAnnotations(document.annotations);
    returnTokens(document.tokens);
  }, [unit, returnTokens]);

  // if returnAnnotations is falsy (so not passed to Document), make setAnnotations
  // falsy as well. This is used further down as a sign that annotations are disabled
  return [tokens, annotations, setAnnotations];
};

export default useUnit;
