import React, { useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { clearSpanAnnotations } from "../Actions";
import { toggleAnnotations } from "../Actions";

import Tokens from "./Tokens";

const AnnotationText = ({ text }) => {
  const spanAnnotations = useSelector((props) => props.spanAnnotations);
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

  // create list with clusters to the right
  // each cluster has a color and label
  // each cluster item is a span
  // users can drag spans between clusters
  // and drag tokens between spans
  // on merely selecting a token, it will be put under 'unassigned' in grey

  // if possible, transform scroll button so that it can be used to select clusters
  // or otherwise right click

  // move the onmouseup logic to annotate. keep Tokens clean for setting up the text
  // also think of how we can get the event functions out of the tokens component.
  // can we pass the onClick function for tokens as a prop, so taht we can change it for different annotating jobs?
  // (this should be possible. But maybe we can also do this via redux)

  // const onSelect = () => {
  //   console.log(token.offset.index);
  //   if (spanAnnotations.some((e) => e.offset === token.offset)) {
  //     dispatch(rmSpanAnnotation(token));
  //   } else {
  //     dispatch(addSpanAnnotation(token));
  //   }
  // };

  const leftMouse = (event) => {
    const selection = window.getSelection();

    if (!(selection.anchorNode && selection.focusNode)) return null;
    const from = selection.anchorNode.parentElement;
    const to = selection.focusNode.parentElement;

    let from_i = getTokenIndex(from);
    let to_i = getTokenIndex(to);

    if (!(from_i && to_i)) return null;
    window.getSelection().empty();

    if (from_i > to_i) [from_i, to_i] = [to_i, from_i];

    const annotations = [];
    for (let i = from_i; i <= to_i; i++) {
      annotations.push({ index: i, group: 1 });
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

const getTokenIndex = (e) => {
  if (e.className === "token") return parseInt(e.getAttribute("tokenIndex"));
  if (e.parentNode) {
    if (e.parentNode.className === "token")
      return parseInt(e.parentNode.getAttribute("tokenIndex"));
  }
  return null;
};

export default AnnotationText;
