import React, { useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { clearSpanAnnotations } from "../Actions";
import { toggleAnnotations } from "../Actions";

import Tokens from "./Tokens";

const AnnotationText = ({ text }) => {
  const codeHistory = useSelector((state) => state.codeHistory);
  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(clearSpanAnnotations());
  }, [text, dispatch]);

  useEffect(() => {
    window.addEventListener("mouseup", onMouseUp);
    return () => {
      window.removeEventListener("mouseup", onMouseUp);
    };
  });

  useEffect(() => {
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
    };
  });

  const onKeyDown = (event) => {
    console.log(event.key); // maybe integrate key navigation
  };

  const onMouseUp = (event) => {
    if (event.which !== 1) return null;

    const selection = window.getSelection();

    if (!(selection.anchorNode && selection.focusNode)) return null;
    let from = getToken(selection.anchorNode.parentElement);
    let to = getToken(selection.focusNode.parentElement);

    if (!(from && to)) return null;
    window.getSelection().empty();

    if (from.index > to.index) [from, to] = [to, from];

    let defaultValue = codeHistory[0] ? codeHistory[0] : null;
    if (!event.ctrlKey) defaultValue = "Not yet assigned";

    const annotations = [];
    for (let i = from.index; i <= to.index; i++) {
      annotations.push({
        index: i,
        group: defaultValue,
        offset: from.offset,
        length: to.offset + to.length,
        span: [from.index, to.index],
      });
    }
    dispatch(toggleAnnotations(annotations));
  };

  if (!text) return null;
  return <Tokens text={text} />;
};

const getTokenAttributes = (tokenNode) => {
  return {
    index: parseInt(tokenNode.getAttribute("tokenIndex")),
    offset: parseInt(tokenNode.getAttribute("tokenOffset")),
    length: parseInt(tokenNode.getAttribute("tokenOffset")),
  };
};

const getToken = (e) => {
  console.log(e);
  if (e.className === "token") return getTokenAttributes(e);
  if (e.parentNode) {
    if (e.parentNode.className === "token")
      return getTokenAttributes(e.parentNode);
  }
  return null;
};

export default AnnotationText;
