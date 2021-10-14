import React, { useEffect } from "react";
import { useDispatch } from "react-redux";
import { setAnnotations, clearAnnotations } from "actions";
import { exportSpanAnnotations } from "util/annotations";
import { getColor, getColorGradient } from "util/tokenDesign";

/**
 * This component loads the annotations from the document of a taskItem into the redux store,
 * and then watches for changes. If new annotations are made (or removed or changed), writes them to
 * indexedDB, and optionally a callback can be specified that can be used to send updates to
 * another backend.
 */
const ManageAnnotations = ({ taskItem, annotations, saveAnnotations }) => {
  const dispatch = useDispatch();

  useEffect(() => {
    return () => {
      taskItem.writable = false;
      dispatch(clearAnnotations());
    };
  }, [taskItem, dispatch]);

  useEffect(() => {
    if (taskItem.writable) {
      writeAnnotations(taskItem, annotations, saveAnnotations);
      showAnnotations(taskItem?.tokens, annotations, taskItem?.codebook);
    }
  }, [taskItem, annotations, saveAnnotations]);

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

const writeAnnotations = async (taskItem, annotations, saveAnnotations) => {
  if (saveAnnotations) {
    //db.writeAnnotations({ doc_uid: taskItem.doc_uid }, annotations);
    if (taskItem.post) {
      const annotationsArray = exportSpanAnnotations(annotations);
      await taskItem.post(taskItem.unitId, annotationsArray);
    }
  }
};

const showAnnotations = (tokens, annotations, codebook) => {
  for (let token of tokens) {
    if (!token.ref?.current) continue;

    let tokenAnnotations = allowedAnnotations(annotations?.[token.index], codebook?.codeMap);

    if (!tokenAnnotations) {
      if (token.ref.current.classList.contains("annotated")) {
        token.ref.current.classList.remove("annotated");
        setTokenColor(token, null, null, null);
      }
      continue;
    }

    annotateToken(token, tokenAnnotations, codebook?.codeMap);
  }
};

const allowedAnnotations = (annotations, codeMap) => {
  if (!annotations) return null;

  if (annotations && codeMap) {
    annotations = { ...annotations };
    for (let code of Object.keys(annotations)) {
      if (!codeMap[code]) continue;
      if (!codeMap[code] || !codeMap[code].active || !codeMap[code].activeParent)
        delete annotations[code];
    }
  }
  return annotations;
};

const annotatedColor = (annotations, codeMap) => {
  let tokenCodes = Object.keys(annotations);
  let colors = tokenCodes.map(code => getColor(code, codeMap));
  return getColorGradient(colors);
};

const annotateToken = (token, annotations, codeMap) => {
  // Set specific classes for nice css to show the start/end of codes

  const allLeft = !Object.values(annotations).some(code => code.span[0] !== code.index);
  const allRight = !Object.values(annotations).some(code => code.span[1] !== code.index);
  const anyLeft = Object.values(annotations).some(code => code.span[0] === code.index);
  const anyRight = Object.values(annotations).some(code => code.span[1] === code.index);

  let annotatedTokenClass = token.ref.current.classList.contains("selected")
    ? ["token", "selected", "annotated"]
    : ["annotated"];

  const cl = token.ref.current.classList;
  cl.add("annotated");
  allLeft ? cl.add("allLeft") : cl.remove("allLeft");
  anyLeft & !allLeft ? cl.add("anyLeft") : cl.remove("anyLeft");
  allRight ? cl.add("allRight") : cl.remove("allRight");
  anyRight & !allRight ? cl.add("anyRight") : cl.remove("anyRight");
  token.ref.current.classList.add(...annotatedTokenClass);

  const textColor = annotatedColor(annotations, codeMap);
  const preColor = allLeft ? "white" : textColor;
  const postColor = allRight ? "white" : textColor;
  setTokenColor(token, preColor, textColor, postColor);
};

const setTokenColor = (token, pre, text, post) => {
  const children = token.ref.current.children;
  children[0].style.background = pre;
  children[1].style.background = text;
  children[2].style.background = post;
};

export default ManageAnnotations;
