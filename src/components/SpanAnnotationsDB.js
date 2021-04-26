import React, { useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { toggleAnnotations } from "../actions";
import db from "../apis/dexie";

// this is a dummy component to listen for changes in annotations and code
// and saving them to the indexed db.

const SpanAnnotationsDB = ({ doc, tokens }) => {
  const annotations = useSelector((state) => state.spanAnnotations);
  //const codes = useSelector((state) => state.codes);
  const [ready, setReady] = useState(false);
  const dispatch = useDispatch();

  useEffect(() => {
    setReady(false);
  }, [doc]);

  useEffect(() => {
    if (tokens.length > 0 && doc.annotations && !ready) {
      matchAnnotations(tokens, doc.annotations, dispatch);
      setReady(true);
    }
  }, [ready, tokens, doc, dispatch]);

  useEffect(() => {
    if (ready) exportAnnotations(doc, annotations);
  }, [ready, doc, annotations]);

  return <div></div>;
};

const exportAnnotations = async (doc, annotations) => {
  let unique = new Set();
  const uniqueAnnotations = Object.values(annotations).reduce((un_ann, ann) => {
    for (let key of Object.keys(ann)) {
      const ann_obj = {
        code: key,
        offset: ann[key].offset,
        length: ann[key].length,
      };
      const json = JSON.stringify(ann_obj);
      if (!unique.has(json)) {
        unique.add(json);
        un_ann.push(ann_obj);
      }
    }
    return un_ann;
  }, []);

  await db.writeAnnotations({ doc_id: doc.doc_id }, uniqueAnnotations);
};

const matchAnnotations = (tokens, importedAnnotations, dispatch) => {
  let trackAnnotations = {};
  let matchedAnnotations = [];

  for (let token of tokens) {
    findMatches(
      token,
      importedAnnotations,
      trackAnnotations,
      matchedAnnotations
    );
  }

  const topCodes = {};
  for (let matchedAnnotation of matchedAnnotations) {
    if (!topCodes[matchedAnnotation.group])
      topCodes[matchedAnnotation.group] = 0;
    topCodes[matchedAnnotation.group]++;
    addAnnotations(matchedAnnotation, dispatch);
  }
  console.log(topCodes);
};

const findMatches = (
  token,
  importedAnnotations,
  trackAnnotations,
  matchedAnnotations
) => {
  const start = token.offset.start;
  const end = token.offset.start + token.offset.length;

  // loop over char offset for token. If a span annotation that
  // starts on this offset is found, initiate a new annotation in trackAnnotations with this
  // token index as the start of the span. If a span annotation that ends on
  // this offset is found, set the token idnex as the end of the span,
  // store annotation in matchedAnnotations, and remove from trackAnnotations
  for (let i = start; i <= end; i++) {
    if (importedAnnotations[i]) {
      for (let code of importedAnnotations[i].start) {
        trackAnnotations[code] = {
          index: token.offset.index,
          group: code,
          offset: start,
          length: null,
          span: [token.offset.index],
        };
      }
      for (let code of importedAnnotations[i].end) {
        trackAnnotations[code].span.push(token.offset.index);
        trackAnnotations[code].length =
          token.offset.start +
          token.offset.length -
          trackAnnotations[code].offset;
        matchedAnnotations.push(trackAnnotations[code]);
        delete trackAnnotations[code];
      }
    }
  }
};

const addAnnotations = (ann, dispatch) => {
  let newAnnotations = [];
  for (let i = ann.span[0]; i <= ann.span[1]; i++) {
    let newAnnotation = { ...ann };
    newAnnotation.index = i;
    newAnnotations.push(newAnnotation);
  }
  dispatch(toggleAnnotations(newAnnotations));
};

export default SpanAnnotationsDB;
