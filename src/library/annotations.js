export const exportSpanAnnotations = (annotations, tokens) => {
  // export annotations from the object format (for fast use in the annotator) to array format
  if (Object.keys(annotations).length === 0) return [];
  const uniqueAnnotations = Object.keys(annotations).reduce((un_ann, index) => {
    const ann = annotations[index];
    for (let key of Object.keys(ann)) {
      //const endIndex = if (index === 'unit' ? index : )

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

export const importSpanAnnotations = (annotationsArray, tokens, currentAnnotations = {}) => {
  if (annotationsArray.length === 0) return { ...currentAnnotations };
  // import span annotations. Uses the offset to match annotations to tokens
  const importedAnnotations = prepareSpanAnnotations(annotationsArray);
  let trackAnnotations = {};
  let matchedAnnotations = [];

  for (let token of tokens) {
    findMatches(token, importedAnnotations, trackAnnotations, matchedAnnotations);
  }

  const codeCounter = {};
  const annArray = [];
  for (let matchedAnnotation of matchedAnnotations) {
    if (!codeCounter[matchedAnnotation.variable]) codeCounter[matchedAnnotation.variable] = 0;
    codeCounter[matchedAnnotation.variable]++;
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

  for (let ann of annArray) {
    currentAnnotations = toggleSpanAnnotation(currentAnnotations, ann, false);
  }

  return currentAnnotations;
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

export const toggleSpanAnnotation = (annotations, newAnnotation, rm) => {
  // Add span annotations in a way that prevents double assignments of the same group to a token

  for (let index = newAnnotation.span[0]; index <= newAnnotation.span[1]; index++) {
    let a = newAnnotation;

    // if group in annotations, remove it
    if (annotations[index]) {
      if (annotations[index][a.variable]) {
        const span = annotations[index][a.variable].span;
        for (let i = span[0]; i <= span[1]; i++) {
          if (annotations[i]) {
            if (annotations[i][a.variable]) {
              delete annotations[i][a.variable];
              if (Object.keys(annotations[i]).length === 0) {
                delete annotations[i];
              }
            }
          }
        }
      }
    }

    if (!rm) {
      if (!annotations[index]) annotations[index] = {};
      annotations[index][a.variable] = {
        index: index,
        span: [a.span[0], a.span[1]],
        length: a.length,
        value: a.value,
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
  // value is an array that tells which variables start and end there
  // used in Tokens for matching to token indices
  return annotations.reduce((obj, ann) => {
    if (!obj[ann.section]) obj[ann.section] = {};
    if (!obj[ann.section][ann.offset]) obj[ann.section][ann.offset] = { start: [], end: [] };
    if (!obj[ann.section][ann.offset + ann.length - 1])
      obj[ann.section][ann.offset + ann.length - 1] = { start: [], end: [] };
    obj[ann.section][ann.offset].start.push(ann); // for the starting point the full annotation is given, so that we have all the information
    obj[ann.section][ann.offset + ann.length - 1].end.push(ann.variable); // for the ending point we just need to know the variable
    return obj;
  }, {});
};

const findMatches = (token, importedAnnotations, trackAnnotations, matchedAnnotations) => {
  const start = token.offset;
  const end = token.offset + token.length - 1;
  if (!importedAnnotations[token.section]) return;
  const sectionAnnotations = importedAnnotations[token.section];

  for (let i = start; i <= end; i++) {
    if (sectionAnnotations[i]) {
      for (let annotation of sectionAnnotations[i].start) {
        trackAnnotations[annotation.variable] = { ...token };
        trackAnnotations[annotation.variable].variable = annotation.variable;
        trackAnnotations[annotation.variable].value = annotation.value;
        trackAnnotations[annotation.variable].offset = start;
        trackAnnotations[annotation.variable].length = null;
        trackAnnotations[annotation.variable].span = [token.index];
      }

      for (let variable of sectionAnnotations[i].end) {
        if (!trackAnnotations[variable]) continue;
        trackAnnotations[variable].span.push(token.index);
        trackAnnotations[variable].length =
          token.offset + token.length - trackAnnotations[variable].offset;
        matchedAnnotations.push(trackAnnotations[variable]);
        delete trackAnnotations[variable];
      }
    }
  }
};
