import React, { useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";

import AnnotateTask from "./AnnotateTask/AnnotateTask";
import QuestionTask from "./QuestionTask/QuestionTask";

import db from "apis/dexie";
import { selectTokens } from "util/selectTokens";
import { setItemSettings } from "actions";
import ManageAnnotations from "./ManageAnnotations";

const Annotator = ({ item, itemSettings }) => {
  const [taskItem, setTaskItem] = useState(null);

  const codeMap = useSelector((state) => state.codeMap);
  const dispatch = useDispatch();

  useEffect(() => {
    if (!item) return null;
    setTaskItem(null);
    prepareTaskItem(item, itemSettings, setTaskItem, codeMap);
    dispatch(setItemSettings(itemSettings));
  }, [item, itemSettings, setTaskItem, codeMap, dispatch]);

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

const prepareTaskItem = async (item, itemSettings, setTaskItem, codeMap) => {
  let taskItem = await db.getDocument(item.doc_uid);
  if (!taskItem) return;
  taskItem.writable = false; // this prevents overwriting annotations before they have been loaded (in spanAnnotationsDB.js)

  // either take tokens from item, or take all tokens from the document and (if necessary) filter on contextUnit
  if (item.tokens != null) {
    taskItem.tokens = item.tokens;
  } else {
    taskItem.tokens = selectTokens(taskItem.tokens, item, itemSettings.contextUnit);
  }

  const firstUnitToken = taskItem.tokens.find((token) => token.textPart === "textUnit");
  let lastUnitToken = taskItem.tokens.find((token) => token.textPart === "contextAfter");
  if (lastUnitToken == null) lastUnitToken = taskItem.tokens[taskItem.tokens.length - 1];
  taskItem.textUnitSpan = [firstUnitToken.offset, lastUnitToken.offset + lastUnitToken.length];

  taskItem.item = item;
  taskItem.itemSettings = itemSettings;

  taskItem.codeMap = codeMap;
  if (taskItem) setTaskItem(taskItem);
};

export default React.memo(Annotator);
