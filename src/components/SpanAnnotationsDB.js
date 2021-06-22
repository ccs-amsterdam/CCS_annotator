import React, { useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { setAnnotations, clearSpanAnnotations } from "../actions";
import db from "../apis/dexie";

// this component generates no content, but manages writing and reading of annotations

const SpanAnnotationsDB = ({ doc }) => {
  let annotations = useSelector((state) => state.spanAnnotations);
  const dispatch = useDispatch();

  useEffect(() => {
    return () => {
      doc.writable = false;
      dispatch(clearSpanAnnotations());
    };
  }, [doc, dispatch]);

  useEffect(() => {
    if (doc.writable) exportAnnotations(doc, annotations, dispatch);
  }, [doc, annotations, dispatch]);

  useEffect(() => {
    if (doc.writable || doc.tokens.length === 0) return;
    importAnnotations(doc, dispatch);
    doc.writable = true; // this ensures that each new doc first does the matching step
  }, [doc, dispatch]);

  return <div></div>;
};

const importAnnotations = (doc, dispatch) => {
  dispatch(setAnnotations(doc.annotations ? doc.annotations : {}));
  doc.writable = true;
};

const exportAnnotations = (doc, annotations, dispatch) => {
  db.writeAnnotations({ doc_uid: doc.doc_uid }, annotations);
};

export default SpanAnnotationsDB;
