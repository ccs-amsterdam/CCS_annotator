import React, { useEffect, useState } from "react";
import { useDispatch } from "react-redux";

import AnnotateTask from "./AnnotateTask";
import QuestionTask from "./QuestionTask";

import db from "apis/dexie";
import { selectTokens } from "util/selectTokens";
import { setItemSettings } from "actions";
import ManageAnnotations from "./ManageAnnotations";

const Annotator = ({ item, itemSettings }) => {
  const [taskItem, setTaskItem] = useState(null);
  const dispatch = useDispatch();

  useEffect(() => {
    if (!item) return null;
    setTaskItem(null);
    prepareTaskItem(item, itemSettings, setTaskItem);
    dispatch(setItemSettings(itemSettings));
  }, [item, itemSettings, setTaskItem, dispatch]);

  const renderTask = (taskType) => {
    switch (taskType) {
      case "annotate":
        return <AnnotateTask taskItem={taskItem} />;
      case "question":
        return <QuestionTask taskItem={taskItem} />;
      default:
        return null;
    }
  };

  if (!item || !taskItem) return null;
  return (
    <>
      {renderTask(itemSettings.taskType)}
      <ManageAnnotations taskItem={taskItem} />
    </>
  );
};

const prepareTaskItem = async (item, itemSettings, setTaskItem) => {
  let doc = await db.getDocument(item.doc_uid);
  if (!doc) return;
  doc.writable = false; // this prevents overwriting annotations before they have been loaded (in spanAnnotationsDB.js)

  // either take tokens from item, or take all tokens from the document and (if necessary) filter on contextUnit
  if (item.tokens != null) {
    doc.tokens = item.tokens;
  } else {
    doc.tokens = selectTokens(doc.tokens, item, itemSettings.contextUnit);
  }
  doc.item = item;
  doc.itemSettings = itemSettings;

  if (doc) setTaskItem(doc);
};

export default React.memo(Annotator);
