import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import hash from "object-hash";

import SpanAnnotationEditor from "./spanAnnotationEditor";
import SpanAnnotationsCoder from "./SpanAnnotationsCoder";

import db from "../apis/dexie";

const AnnotationPage = ({ codingjob, item, taskType, contextUnit }) => {
  const [doc, setDoc] = useState(null);
  const codeMap = useSelector((state) => state.codeMap);

  useEffect(() => {
    if (!codingjob || !item) return null;
    documentSelector(codingjob, item, setDoc, hash(codeMap));
  }, [codingjob, codeMap, item, taskType, setDoc]);

  const renderTask = (taskType) => {
    switch (taskType) {
      case "open annotation":
        return <SpanAnnotationEditor doc={doc} item={item} contextUnit={contextUnit} />;
      case "question based":
        return <SpanAnnotationsCoder doc={doc} item={item} contextUnit={contextUnit} />;
      default:
        return null;
    }
  };

  if (!codingjob || !item || !doc) return null;

  return renderTask(taskType);
};

const documentSelector = async (codingjob, item, setDoc, codeMapHash) => {
  let doc = await db.getJobDocuments(codingjob, item.docIndex, 1);
  if (!doc) return;
  doc = doc[0]; // getJobDocuments returns array of length 1
  doc.codeMapHash = codeMapHash;
  doc.writable = false;
  if (doc) setDoc(doc);
};

export default AnnotationPage;
