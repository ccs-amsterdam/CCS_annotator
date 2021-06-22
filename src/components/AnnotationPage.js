import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import hash from "object-hash";

import SpanAnnotationEditor from "./spanAnnotationEditor";
import SpanAnnotationsCoder from "./SpanAnnotationsCoder";
import Tokens from "./Tokens";

import db from "../apis/dexie";

const AnnotationPage = ({ codingjob, item, mode }) => {
  const [doc, setDoc] = useState(null);
  const codeMap = useSelector((state) => state.codeMap);

  let context = { span: [10, 12], sentence_window: [1, 1], token_window: [50, 50] };

  useEffect(() => {
    if (!codingjob || !item) return null;
    documentSelector(codingjob, item, setDoc, hash(codeMap));
  }, [codingjob, codeMap, item, setDoc]);

  const renderMode = (mode) => {
    switch (mode) {
      case "free":
        return (
          <SpanAnnotationEditor doc={doc}>
            <Tokens doc={doc} item={item} />
          </SpanAnnotationEditor>
        );
      case "code":
        return (
          <SpanAnnotationsCoder doc={doc}>
            <Tokens doc={doc} item={item} />
          </SpanAnnotationsCoder>
        );
      default:
        return null;
    }
  };

  if (!codingjob || !item || !doc) return null;
  return renderMode(mode);
};

const documentSelector = async (codingjob, item, setDoc, codeMapHash) => {
  let doc = await db.getJobDocuments(codingjob, item.docIndex, 1);
  doc = doc[0]; // getJobDocuments returns array of length 1
  doc.codeMapHash = codeMapHash;
  doc.writable = false;
  if (doc) setDoc(doc);
};

export default AnnotationPage;
