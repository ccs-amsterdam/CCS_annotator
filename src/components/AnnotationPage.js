import React, { useEffect, useState } from "react";

import SpanAnnotationEditor from "./spanAnnotationEditor";
import SpanAnnotationsCoder from "./SpanAnnotationsCoder";

import db from "../apis/dexie";
import { selectTokens } from "../util/selectTokens";

const AnnotationPage = ({ item, itemSettings }) => {
  const [doc, setDoc] = useState(null);

  useEffect(() => {
    if (!item) return null;
    setDoc(null);
    documentSelector(item, itemSettings, setDoc);
  }, [item, itemSettings, setDoc]);

  const renderTask = (taskType) => {
    switch (taskType) {
      case "annotate":
        return <SpanAnnotationEditor doc={doc} />;
      case "question":
        return <SpanAnnotationsCoder doc={doc} />;
      default:
        return null;
    }
  };

  if (!item || !doc) return null;
  return renderTask(itemSettings.taskType);
};

const documentSelector = async (item, itemSettings, setDoc) => {
  let doc = await db.getDocument(item.doc_uid);
  if (!doc) return;
  //doc.codeMapHash = codeMapHash;
  doc.writable = false; // this prevents overwriting annotations before they have been loaded (in spanAnnotationsDB.js)

  // either take tokens from item, or take all tokens from the document and (if necessary) filter on contextUnit
  if (item.tokens != null) {
    doc.tokens = item.tokens;
  } else {
    doc.tokens = selectTokens(doc.tokens, item, itemSettings.contextUnit);
  }
  if (item.annotation) doc.itemAnnotation = item.annotation;
  if (doc) setDoc(doc);
};

export default React.memo(AnnotationPage, (prev, next) => {
  // for (let k of Object.keys(prev)) {
  //   if (prev[k] !== next[k]) console.log(k);
  // }
});
