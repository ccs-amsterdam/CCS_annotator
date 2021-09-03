import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import hash from "object-hash";

import SpanAnnotationEditor from "./spanAnnotationEditor";
import SpanAnnotationsCoder from "./SpanAnnotationsCoder";

import db from "../apis/dexie";
import { selectTokens } from "../util/selectTokens";

const AnnotationPage = ({ item, taskType, contextUnit }) => {
  const [doc, setDoc] = useState(null);
  const codeMap = useSelector(state => state.codeMap);

  useEffect(() => {
    if (!item) return null;
    setDoc(null);
    documentSelector(item, setDoc, hash(codeMap), contextUnit);
  }, [codeMap, item, taskType, contextUnit, setDoc]);

  const renderTask = taskType => {
    switch (taskType) {
      case "open annotation":
        return <SpanAnnotationEditor doc={doc} />;
      case "question based":
        return <SpanAnnotationsCoder doc={doc} />;
      default:
        return null;
    }
  };

  if (!item || !doc) return null;

  return renderTask(taskType);
};

const documentSelector = async (item, setDoc, codeMapHash, contextUnit) => {
  let doc = await db.getDocument(item.doc_uid);
  if (!doc) return;
  doc.codeMapHash = codeMapHash;
  doc.writable = false; // this prevents overwriting annotations before they have been loaded (in spanAnnotationsDB.js)

  // add prepareTokens here
  if (doc.selectedTokens == null) doc.selectedTokens = selectTokens(doc.tokens, item, contextUnit);
  if (item.annotation) doc.itemAnnotation = item.annotation;

  if (doc) setDoc(doc);
};

export default React.memo(AnnotationPage, (prev, next) => {
  // for (let k of Object.keys(prev)) {
  //   if (prev[k] !== next[k]) console.log(k);
  // }
});
