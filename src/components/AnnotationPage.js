import React, { useEffect, useState } from "react";
import { useDispatch } from "react-redux";

import SpanAnnotationEditor from "./spanAnnotationEditor";
import SpanAnnotationsCoder from "./SpanAnnotationsCoder";

import db from "../apis/dexie";
import { selectTokens } from "../util/selectTokens";
import { setItemSettings } from "../actions";

const AnnotationPage = ({ item, itemSettings }) => {
  const [doc, setDoc] = useState(null);
  const dispatch = useDispatch();

  useEffect(() => {
    if (!item) return null;
    setDoc(null);
    documentSelector(item, itemSettings, setDoc);
    dispatch(setItemSettings(itemSettings));
  }, [item, itemSettings, setDoc, dispatch]);

  const renderTask = taskType => {
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
  console.log(itemSettings);

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
