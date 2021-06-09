// import React, { useEffect } from "react";
// import { useSelector, useDispatch } from "react-redux";
// import { appendCodeHistory, resetCodeHistory, setAnnotations } from "../actions";
// import db from "../apis/dexie";

// // this component generates no content, but manages writing and reading of annotations

// const SpanAnnotationsDB = ({ doc }) => {
//   let annotations = useSelector((state) => state.spanAnnotations);
//   const dispatch = useDispatch();

//   useEffect(() => {
//     if (doc.writable) exportAnnotations(doc, annotations);
//   }, [doc, annotations]);

//   useEffect(() => {
//     if (doc.writable || doc.tokens.length === 0) return;
//     matchAnnotations(doc, dispatch);
//     doc.writable = true; // this ensures that each new doc first does the matching step
//   }, [doc, dispatch]);

//   return <div></div>;
// };

// const exportAnnotations = async (doc, annotations) => {
//   const uniqueAnnotations = Object.values(annotations).reduce((un_ann, ann) => {
//     for (let key of Object.keys(ann)) {
//       if (ann[key].index !== ann[key].span[0]) continue;
//       const annotationTokens = doc.tokens.slice(ann[key].span[0], ann[key].span[1] + 1);
//       const text = annotationTokens
//         .map((at, i) => {
//           const pre = i > 0 ? at.pre : "";
//           const post = i < annotationTokens.length - 1 ? at.post : "";
//           return pre + at.text + post;
//         })
//         .join("");
//       const ann_obj = {
//         code: key,
//         text: text,
//         section: ann[key].section,
//         offset: ann[key].offset,
//         length: ann[key].length,
//         index: ann[key].index,
//         ngram: ann[key].span[1] - ann[key].span[0] + 1,
//         coding: ann[key].coding,
//       };
//       un_ann.push(ann_obj);
//     }
//     return un_ann;
//   }, []);

//   await db.writeAnnotations({ doc_id: doc.doc_id }, uniqueAnnotations);
// };

// const matchAnnotations = (doc, dispatch) => {
//   const importedAnnotations = prepareAnnotations(doc.annotations);
//   let trackAnnotations = {};
//   let matchedAnnotations = [];

//   for (let token of doc.tokens) {
//     findMatches(token, importedAnnotations, trackAnnotations, matchedAnnotations);
//   }

//   const codeCounter = {};
//   const annArray = [];
//   for (let matchedAnnotation of matchedAnnotations) {
//     if (!codeCounter[matchedAnnotation.group]) codeCounter[matchedAnnotation.group] = 0;
//     codeCounter[matchedAnnotation.group]++;
//     annArray.push(matchedAnnotation);
//   }
//   addAnnotations(annArray, dispatch);

//   let topCodes = Object.keys(codeCounter).sort(function (a, b) {
//     return codeCounter[a] - codeCounter[b];
//   });
//   dispatch(resetCodeHistory());
//   for (const code of topCodes.slice(-5)) {
//     if (code === "UNASSIGNED") continue;
//     dispatch(appendCodeHistory(code));
//   }
// };

// const findMatches = (token, importedAnnotations, trackAnnotations, matchedAnnotations) => {
//   const start = token.offset;
//   const end = token.offset + token.length;
//   if (!importedAnnotations[token.section]) return;
//   const sectionAnnotations = importedAnnotations[token.section];

//   for (let i = start; i <= end; i++) {
//     //const key = `${token.section}-${i}`;

//     if (sectionAnnotations[i]) {
//       for (let annotation of sectionAnnotations[i].start) {
//         trackAnnotations[annotation.code] = { ...token };
//         trackAnnotations[annotation.code].group = annotation.code;
//         trackAnnotations[annotation.code].coding = annotation.coding;
//         trackAnnotations[annotation.code].offset = start;
//         trackAnnotations[annotation.code].length = null;
//         trackAnnotations[annotation.code].span = [token.index];
//       }

//       for (let code of sectionAnnotations[i].end) {
//         if (!trackAnnotations[code]) continue;
//         trackAnnotations[code].span.push(token.index);
//         trackAnnotations[code].length = token.offset + token.length - trackAnnotations[code].offset;
//         matchedAnnotations.push(trackAnnotations[code]);
//         delete trackAnnotations[code];
//       }
//     }
//   }
// };

// const prepareAnnotations = (annotations) => {
//   if (!annotations || annotations === "") return {};

//   // create an object where the key is a section+offset, and the
//   // value is an array that tells which codes start and end there
//   // used in Tokens for matching to token indices
//   // (switching to tokenindices keeps the annotation nice and fast. in time
//   //  we might also move the internal storage to tokenindices instead of
//   //  converting back and fro spans, but for now it helps ensure they're aligned)
//   return annotations.reduce((obj, ann) => {
//     if (!obj[ann.section]) obj[ann.section] = {};
//     if (!obj[ann.section][ann.offset]) obj[ann.section][ann.offset] = { start: [], end: [] };
//     if (!obj[ann.section][ann.offset + ann.length])
//       obj[ann.section][ann.offset + ann.length] = { start: [], end: [] };
//     obj[ann.section][ann.offset].start.push(ann); // for the starting point the full annotation is given, so that we have all the information
//     obj[ann.section][ann.offset + ann.length].end.push(ann.code); // for the ending point we just need to know the code to close the annotation off
//     return obj;
//   }, {});
// };

// const addAnnotations = (annArray, dispatch) => {
//   let newAnnotations = [];
//   for (let ann of annArray) {
//     for (let i = ann.span[0]; i <= ann.span[1]; i++) {
//       let newAnnotation = { ...ann };
//       newAnnotation.index = i;
//       newAnnotations.push(newAnnotation);
//     }
//   }

//   dispatch(setAnnotations(newAnnotations));
// };

// export default SpanAnnotationsDB;
