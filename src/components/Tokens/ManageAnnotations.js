import React, { useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { setAnnotations, clearAnnotations } from "actions";
import db from "apis/dexie";

/**
 * This component loads the annotations from the document of a taskItem into the redux store,
 * and then watches for changes. If new annotations are made (or removed or changed), writes them to
 * indexedDB, and optionally a callback can be specified that can be used to send updates to
 * another backend.
 */
const ManageAnnotations = ({ taskItem, callback, saveAnnotations }) => {
  let annotations = useSelector((state) => state.annotations);
  const dispatch = useDispatch();

  useEffect(() => {
    return () => {
      taskItem.writable = false;
      dispatch(clearAnnotations());
    };
  }, [taskItem, dispatch]);

  useEffect(() => {
    if (taskItem.writable) {
      writeAnnotations(taskItem, annotations, saveAnnotations, callback);
    }
  }, [taskItem, annotations, saveAnnotations, callback]);

  useEffect(() => {
    if (taskItem.writable || taskItem.tokens.length === 0) return;
    importAnnotations(taskItem, dispatch);
    taskItem.writable = true; // this ensures that each new doc first does the matching step
  }, [taskItem, dispatch]);

  return <div></div>;
};

const importAnnotations = (taskItem, dispatch) => {
  dispatch(setAnnotations(taskItem.annotations ? taskItem.annotations : {}));
  taskItem.writable = true;
};

const writeAnnotations = (taskItem, annotations, saveAnnotations, callback) => {
  if (saveAnnotations) {
    db.writeAnnotations({ doc_uid: taskItem.doc_uid }, annotations);
    if (callback) callback(taskItem, annotations);
  }
};

export default ManageAnnotations;
