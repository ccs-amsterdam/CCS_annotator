export const exportAnnotations = (annotations) => {
  annotations = annotations["span"];
  // export annotations from the object format (for fast use in the annotator) to array format
  if (Object.keys(annotations).length === 0) return [];
  const uniqueAnnotations = Object.keys(annotations).reduce((un_ann, index) => {
    const ann = annotations[index];
    console.log(ann);
    for (let key of Object.keys(ann)) {
      if (index !== "unit") if (ann[key].index !== ann[key].span[0]) continue;
      const ann_obj = {
        variable: key,
        value: ann[key].value,
        section: ann[key].section,
        offset: ann[key].offset,
        length: ann[key].length,
      };
      un_ann.push(ann_obj);
    }
    return un_ann;
  }, []);
  return uniqueAnnotations;
};

export const importAnnotations = (annotations, tokens) => {
  if (!annotations) {
    return { document: {}, paragraph: {}, sentence: {}, span: {} };
  }
  if (!annotations.document) annotations.document = {};
  if (!annotations.paragraph) annotations.paragraph = {};
  if (!annotations.sentence) annotations.sentence = {};
  if (annotations.span) {
    annotations.span = importSpanAnnotations({}, annotations.span, tokens);
  } else annotations.span = {};

  for (let key of Object.keys(annotations)) {
    if (key !== "document" && key !== "paragraph" && key !== "sentence" && key !== "span")
      delete annotations[key];
  }

  return annotations;
};

export const importSpanAnnotations = (currentAnnotations, newAnnotations, tokens) => {
  // import span annotations. Uses the offset to match annotations to tokens
  const importedAnnotations = prepareSpanAnnotations(newAnnotations);
  let trackAnnotations = {};
  let matchedAnnotations = [];

  for (let token of tokens) {
    findMatches(token, importedAnnotations, trackAnnotations, matchedAnnotations);
  }

  const codeCounter = {};
  const annArray = [];
  for (let matchedAnnotation of matchedAnnotations) {
    if (!codeCounter[matchedAnnotation.group]) codeCounter[matchedAnnotation.group] = 0;
    codeCounter[matchedAnnotation.group]++;
    annArray.push(matchedAnnotation);
  }

  let addAnnotations = [];
  for (let ann of annArray) {
    for (let i = ann.span[0]; i <= ann.span[1]; i++) {
      let newAnnotation = { ...ann };
      newAnnotation.index = i;
      addAnnotations.push(newAnnotation);
    }
  }

  return toggleSpanAnnotations(currentAnnotations, addAnnotations, false);
};

export const toggleAnnotation = (annotations, unit, index, group, annotation) => {
  if (!annotations[unit][index]) annotations[unit][index] = {};

  if (annotation === null) {
    delete annotations[unit][index][group];
    if (Object.keys(annotations[unit][index]).length === 0) {
      delete annotations[unit][index];
    }
  } else {
    annotations[unit][index][group] = annotation;
  }

  return annotations;
};

export const toggleSpanAnnotations = (annotations, annList, rm) => {
  // Add span annotations in a way that prevents double assignments of the same group to a token

  for (let a of annList) {
    // if group in annotations, remove it
    if (annotations[a.index]) {
      if (annotations[a.index][a.group]) {
        const span = annotations[a.index][a.group].span;
        for (let i = span[0]; i <= span[1]; i++) {
          if (annotations[i]) {
            if (annotations[i][a.group]) {
              delete annotations[i][a.group];
              if (Object.keys(annotations[i]).length === 0) {
                delete annotations[i];
              }
            }
          }
        }
      }
    }

    if (!rm) {
      if (!annotations[a.index]) annotations[a.index] = {};
      annotations[a.index][a.group] = {
        index: a.index,
        span: [a.span[0], a.span[1]],
        length: a.length,
        section: a.section,
        offset: a.offset,
      };
    }
  }
  return annotations;
};

const prepareSpanAnnotations = (annotations) => {
  if (!annotations || annotations === "") return {};
  // create an object where the key is a section+offset, and the
  // value is an array that tells which codes start and end there
  // used in Tokens for matching to token indices
  return annotations.reduce((obj, ann) => {
    if (!obj[ann.section]) obj[ann.section] = {};
    if (!obj[ann.section][ann.offset]) obj[ann.section][ann.offset] = { start: [], end: [] };
    if (!obj[ann.section][ann.offset + ann.length])
      obj[ann.section][ann.offset + ann.length] = { start: [], end: [] };
    obj[ann.section][ann.offset].start.push(ann); // for the starting point the full annotation is given, so that we have all the information
    obj[ann.section][ann.offset + ann.length].end.push(ann.code); // for the ending point we just need to know the code to close the annotation off
    return obj;
  }, {});
};

const findMatches = (token, importedAnnotations, trackAnnotations, matchedAnnotations) => {
  const start = token.offset;
  const end = token.offset + token.length;
  if (!importedAnnotations[token.section]) return;
  const sectionAnnotations = importedAnnotations[token.section];

  for (let i = start; i <= end; i++) {
    //const key = `${token.section}-${i}`;

    if (sectionAnnotations[i]) {
      for (let annotation of sectionAnnotations[i].start) {
        trackAnnotations[annotation.code] = { ...token };
        trackAnnotations[annotation.code].group = annotation.code;
        trackAnnotations[annotation.code].coding = annotation.coding;
        trackAnnotations[annotation.code].offset = start;
        trackAnnotations[annotation.code].length = null;
        trackAnnotations[annotation.code].span = [token.index];
      }

      for (let code of sectionAnnotations[i].end) {
        if (!trackAnnotations[code]) continue;
        trackAnnotations[code].span.push(token.index);
        trackAnnotations[code].length = token.offset + token.length - trackAnnotations[code].offset;
        matchedAnnotations.push(trackAnnotations[code]);
        delete trackAnnotations[code];
      }
    }
  }
};
