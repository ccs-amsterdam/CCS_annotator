import React, { useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { clearSpanAnnotations } from "../Actions";
import { toggleAnnotations } from "../Actions";

import Tokens from "./Tokens";

const AnnotationText = ({ text }) => {
  const tokenIndices = useSelector((state) => state.tokenIndices);
  const code = useSelector((state) => state.code);
  const spanAnnotations = useSelector((state) => state.spanAnnotations);
  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(clearSpanAnnotations());
  }, [text, dispatch]);

  useEffect(() => {
    document.body.addEventListener("mouseup", onMouseUp);
    return () => {
      document.body.removeEventListener("mouseup", onMouseUp);
    };
  });

  const leftMouse = (event) => {
    const selection = window.getSelection();

    if (!(selection.anchorNode && selection.focusNode)) return null;
    let from = getToken(selection.anchorNode.parentElement);
    let to = getToken(selection.focusNode.parentElement);

    if (!(from && to)) return null;
    window.getSelection().empty();

    if (from.index > to.index) [from, to] = [to, from];

    const annotations = [];
    for (let i = from.index; i <= to.index; i++) {
      annotations.push({
        index: i,
        group: code,
        offset: from.offset,
        length: to.offset + to.length,
        span: [from.index, to.index],
      });
    }

    dispatch(toggleAnnotations(annotations));
  };

  const onMouseUp = (event) => {
    console.log(event.which);
    if (event.which === 1) leftMouse(event);
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
