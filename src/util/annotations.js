export const exportSpanAnnotations = async (doc, annotations) => {
  // export annotations from the object format (for fast use in the annotator) to array format
  const uniqueAnnotations = Object.values(annotations).reduce((un_ann, ann) => {
    for (let key of Object.keys(ann)) {
      if (ann[key].index !== ann[key].span[0]) continue;
      const annotationTokens = doc.tokens.slice(ann[key].span[0], ann[key].span[1] + 1);
      const text = annotationTokens
        .map((at, i) => {
          const pre = i > 0 ? at.pre : "";
          const post = i < annotationTokens.length - 1 ? at.post : "";
          return pre + at.text + post;
        })
        .join("");
      const ann_obj = {
        code: key,
        text: text,
        section: ann[key].section,
        offset: ann[key].offset,
        length: ann[key].length,
        index: ann[key].index,
        ngram: ann[key].span[1] - ann[key].span[0] + 1,
        coding: ann[key].coding,
      };
      un_ann.push(ann_obj);
    }
    return un_ann;
  }, []);

  return uniqueAnnotations;
};

export const importSpanAnnotations = (currentAnnotations, newAnnotations, tokens) => {
  // import span annotations. Uses the offset to match annotations to tokens
  const importedAnnotations = prepareAnnotations(newAnnotations);
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

  return toggleAnnotations(currentAnnotations, addAnnotations, false);
};

export const toggleAnnotations = (annotations, annList, rm) => {
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

const prepareAnnotations = annotations => {
  if (!annotations || annotations === "") return {};

  // create an object where the key is a section+offset, and the
  // value is an array that tells which codes start and end there
  // used in Tokens for matching to token indices
  // (switching to tokenindices keeps the annotation nice and fast. in time
  //  we might also move the internal storage to tokenindices instead of
  //  converting back and fro spans, but for now it helps ensure they're aligned)
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
