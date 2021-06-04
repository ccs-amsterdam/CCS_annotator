import React, { useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { appendCodeHistory, resetCodeHistory, setAnnotations } from "../actions";
import db from "../apis/dexie";

// this component generates no content, but manages writing and reading of annotations

const SpanAnnotationsDB = ({ doc, tokens }) => {
  let annotations = useSelector((state) => state.spanAnnotations);
  const dispatch = useDispatch();

  useEffect(() => {
    if (doc.writable) exportAnnotations(doc, annotations, tokens);
  }, [doc, tokens, annotations]);

  useEffect(() => {
    if (doc.writable || tokens.length === 0) return;
    matchAnnotations(tokens, doc.annotations, dispatch);
    doc.writable = true; // this ensures that each new doc first does the matching step
  }, [doc, tokens, dispatch]);

  return <div></div>;
};

const exportAnnotations = async (doc, annotations, tokens) => {
  const uniqueAnnotations = Object.values(annotations).reduce((un_ann, ann) => {
    for (let key of Object.keys(ann)) {
      if (ann[key].index !== ann[key].span[0]) continue;
      const annotationTokens = tokens.slice(ann[key].span[0], ann[key].span[1] + 1);
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
        index: ann[key].index,
        length: ann[key].length,
      };
      un_ann.push(ann_obj);
    }
    return un_ann;
  }, []);

  await db.writeAnnotations({ doc_id: doc.doc_id }, uniqueAnnotations);
};

const matchAnnotations = (tokens, annotations, dispatch) => {
  console.log("matching annotations");
  console.log(annotations);
  const importedAnnotations = prepareAnnotations(annotations);
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
  addAnnotations(annArray, dispatch);

  let topCodes = Object.keys(codeCounter).sort(function (a, b) {
    return codeCounter[a] - codeCounter[b];
  });
  dispatch(resetCodeHistory());
  for (const code of topCodes.slice(-5)) {
    if (code === "UNASSIGNED") continue;
    dispatch(appendCodeHistory(code));
  }
};

const findMatches = (token, importedAnnotations, trackAnnotations, matchedAnnotations) => {
  const start = token.offset;
  const end = token.offset + token.length;

  for (let i = start; i <= end; i++) {
    const key = `${token.section}-${i}`;

    if (importedAnnotations[key]) {
      for (let code of importedAnnotations[key].start) {
        trackAnnotations[code] = { ...token };
        trackAnnotations[code].group = code;
        trackAnnotations[code].offset = start;
        trackAnnotations[code].length = null;
        trackAnnotations[code].span = [token.index];
      }

      for (let code of importedAnnotations[key].end) {
        if (!trackAnnotations[code]) continue;
        trackAnnotations[code].span.push(token.index);
        trackAnnotations[code].length = token.offset + token.length - trackAnnotations[code].offset;
        matchedAnnotations.push(trackAnnotations[code]);
        delete trackAnnotations[code];
      }
    }
  }
};

const prepareAnnotations = (annotations) => {
  if (!annotations || annotations === "") return {};

  // create an object where the key is a section+offset, and the
  // value is an array that tells which codes start and end there
  // used in Tokens for matching to token indices
  // (switching to tokenindices keeps the annotation nice and fast. in time
  //  we might also move the internal storage to tokenindices instead of
  //  converting back and fro spans, but for now it helps ensure they're aligned)
  return annotations.reduce((obj, ann) => {
    const startKey = `${ann.section}-${ann.offset}`;
    const endKey = `${ann.section}-${ann.offset + ann.length}`;
    if (!obj[startKey]) obj[startKey] = { start: [], end: [] };
    if (!obj[endKey]) obj[endKey] = { start: [], end: [] };
    obj[startKey].start.push(ann.code);
    obj[endKey].end.push(ann.code);
    return obj;
  }, {});
};

const addAnnotations = (annArray, dispatch) => {
  let newAnnotations = [];
  for (let ann of annArray) {
    for (let i = ann.span[0]; i <= ann.span[1]; i++) {
      let newAnnotation = { ...ann };
      newAnnotation.index = i;
      newAnnotations.push(newAnnotation);
    }
  }

  dispatch(setAnnotations(newAnnotations));
};

export default SpanAnnotationsDB;
