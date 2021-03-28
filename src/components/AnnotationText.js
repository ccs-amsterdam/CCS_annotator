import React, { useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { clearSpanAnnotations } from "../actions";
import { toggleAnnotations } from "../actions";
import ManageAnnotations from "./ManageAnnotations";

import Tokens from "./Tokens";

const AnnotationText = ({ doc }) => {
  const codeHistory = useSelector((state) => state.codeHistory);
  const [tokens, setTokens] = useState([]);
  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(clearSpanAnnotations());
  }, [doc, dispatch]);

  // USE THIS LATER TO ENABLE DIRECT CODE SELECTION WITH MOUSE
  // (showing current code next to line)
  // useEffect(() => {
  //   window.addEventListener("mousemove", onMouseMove);
  //   return () => {
  //     window.removeEventListener("mousemove", onMouseMove);
  //   };
  // });

  // const onMouseMove = (event) => {
  //   if (event.ctrlKey) {
  //     console.log(event.pageX);
  //   }
  // };

  useEffect(() => {
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
    };
  });

  useEffect(() => {
    window.addEventListener("mouseup", onMouseUp);
    return () => {
      window.removeEventListener("mouseup", onMouseUp);
    };
  });

  const onKeyDown = (event) => {
    console.log(event.key); // maybe integrate key navigation
  };

  const onMouseUp = (event) => {
    if (event.which !== 1) return null;
    event.preventDefault();

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
        length: to.offset + to.length - from.offset,
        span: [from.index, to.index],
      });
    }
    dispatch(toggleAnnotations(annotations));
  };

  if (!doc) return null;
  return (
    <>
      <Tokens text={doc.text} setTokens={setTokens} />
      <ManageAnnotations tokens={tokens} doc={doc} />
    </>
  );
};

const getTokenAttributes = (tokenNode) => {
  return {
    index: parseInt(tokenNode.getAttribute("tokenindex")),
    offset: parseInt(tokenNode.getAttribute("tokenoffset")),
    length: parseInt(tokenNode.getAttribute("tokenlength")),
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
