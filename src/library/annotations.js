const createId = (annotation) => {
  return annotation.variable + "|" + annotation.value;
};

export const exportSpanAnnotations = (annotations, tokens, includeText = false) => {
  // export annotations from the object format (for fast use in the annotator) to array format
  if (Object.keys(annotations).length === 0) return [];
  const uniqueAnnotations = Object.keys(annotations).reduce((un_ann, index) => {
    const ann = annotations[index];
    for (let id of Object.keys(ann)) {
      //const endIndex = if (index === 'unit' ? index : )

      if (index !== "unit") if (ann[id].index !== ann[id].span[0]) continue;

      const ann_obj = {
        variable: ann[id].variable,
        value: ann[id].value,
        section: ann[id].section,
        offset: ann[id].offset,
        length: ann[id].length,
      };

      if (includeText) {
        const span = ann[id].span;
        const text = tokens
          .slice(span[0], span[1] + 1)
          .map((t) => t.pre + t.text + t.post)
          .join("");
        ann_obj["text"] = text;
      }

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
    if (!codeCounter[matchedAnnotation.id]) codeCounter[matchedAnnotation.id] = 0;
    codeCounter[matchedAnnotation.id]++;
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

export const toggleSpanAnnotation = (annotations, newAnnotation, rm) => {
  // Add span annotations in a way that prevents double assignments of the same group to a token
  const id = createId(newAnnotation);

  for (let index = newAnnotation.span[0]; index <= newAnnotation.span[1]; index++) {
    // Check if there exists an annotation with the same variable+value at this position and if so delete it
    if (annotations[index]) {
      console.log(id);
      if (annotations[index][id]) {
        // if an annotation with the same id exists, iterating over it's span to remove entirely
        const span = annotations[index][id].span;
        for (let i = span[0]; i <= span[1]; i++) {
          // since we go from the span, we are actually certain the annotation exists at these indices
          // but we just double check for stability
          if (annotations[i]) {
            if (annotations[i][id]) {
              delete annotations[i][id];
              if (Object.keys(annotations[i]).length === 0) {
                // if there are no annotations for this position left, delete the entry
                delete annotations[i];
              }
            }
          }
        }
      }
    }

    if (!rm) {
      // add the annotation
      if (!annotations[index]) annotations[index] = {};
      annotations[index][id] = {
        index: index,
        variable: newAnnotation.variable,
        span: [newAnnotation.span[0], newAnnotation.span[1]],
        length: newAnnotation.length,
        value: newAnnotation.value,
        section: newAnnotation.section,
        offset: newAnnotation.offset,
      };
    }
  }

  return annotations;
};

const prepareSpanAnnotations = (annotations) => {
  if (!annotations || annotations === "") return {};
  // create an object where the key is a section+offset, and the
  // value is an array that tells which ids (variable|value) start and end there
  // used in Tokens for matching to token indices
  return annotations.reduce((obj, ann) => {
    if (!obj[ann.section]) obj[ann.section] = {};
    if (!obj[ann.section][ann.offset]) obj[ann.section][ann.offset] = { start: [], end: [] };
    if (!obj[ann.section][ann.offset + ann.length - 1])
      obj[ann.section][ann.offset + ann.length - 1] = { start: [], end: [] };
    obj[ann.section][ann.offset].start.push(ann); // for the starting point the full annotation is given, so that we have all the information
    obj[ann.section][ann.offset + ann.length - 1].end.push(createId(ann)); // for the ending point we just need to know the id
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
        const id = createId(annotation);
        trackAnnotations[id] = {
          ...token,
          id,
          variable: annotation.variable,
          value: annotation.value,
          offset: annotation.offset,
          length: null,
          span: [token.index],
        };
      }

      for (let id of sectionAnnotations[i].end) {
        if (!trackAnnotations[id]) continue;
        trackAnnotations[id].span.push(token.index);
        trackAnnotations[id].length = token.offset + token.length - trackAnnotations[id].offset;
        matchedAnnotations.push(trackAnnotations[id]);
        delete trackAnnotations[id];
      }
    }
  }
};
