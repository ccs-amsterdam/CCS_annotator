import React, { useState, useEffect } from "react";
import AnnotationEvents from "./AnnotationEvents";
import { Popup, List } from "semantic-ui-react";
import { getColor, getColorGradient } from "util/tokenDesign";

/**
 * The NavigationEvents component handles all eventlisteners
 * AnnotateNavigation furthermore takes the position and selection information
 * from the navigation to highlight the tokens and show popups
 */
const AnnotateNavigation = ({
  tokens,
  codeMap,
  annotations,
  triggerCodePopup,
  eventsBlocked,
  fullScreenNode,
  disableAnnotations,
}) => {
  const [currentToken, setCurrentToken] = useState(0);
  const [tokenSelection, setTokenSelection] = useState([]);

  useEffect(() => {
    if (!codeMap) return null;
    showAnnotations(tokens, annotations, codeMap);
  }, [tokens, annotations, codeMap]);

  useEffect(() => {
    showSelection(tokens, tokenSelection);
  }, [tokens, tokenSelection]);

  return (
    <>
      <AnnotationPopup
        tokens={tokens}
        currentToken={currentToken}
        annotations={annotations}
        codeMap={codeMap}
        fullScreenNode={fullScreenNode}
      />
      {disableAnnotations ? null : (
        <AnnotationEvents
          tokens={tokens}
          currentToken={currentToken}
          setCurrentToken={setCurrentToken}
          tokenSelection={tokenSelection}
          setTokenSelection={setTokenSelection}
          triggerCodePopup={triggerCodePopup}
          eventsBlocked={eventsBlocked}
        />
      )}
    </>
  );
};

const showAnnotations = (tokens, annotations, codeMap) => {
  for (let token of tokens) {
    if (!token.ref?.current) continue;

    let tokenAnnotations = allowedAnnotations(annotations?.[token.index], codeMap);

    if (!tokenAnnotations) {
      if (token.ref.current.classList.contains("annotated")) {
        token.ref.current.classList.remove("annotated");
        setTokenColor(token, null, null, null);
      }
      continue;
    }

    annotateToken(token, tokenAnnotations, codeMap);
  }
};

const allowedAnnotations = (annotations, codeMap) => {
  console.log(annotations);
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

  const isLeft = Object.values(annotations).filter(code => code.span[0] === code.index);
  const isRight = Object.values(annotations).filter(code => code.span[1] === code.index);
  const allLeft = isLeft.length === Object.values(annotations).length;
  const allRight = isRight.length === Object.values(annotations).length;
  const anyLeft = isLeft.length > 0;
  const anyRight = isRight.length > 0;

  // let annotatedTokenClass = token.ref.current.classList.contains("selected")
  //   ? ["token", "selected", "annotated"]
  //   : ["annotated"];

  const cl = token.ref.current.classList;
  cl.add("annotated");
  allLeft ? cl.add("allLeft") : cl.remove("allLeft");
  anyLeft & !allLeft ? cl.add("anyLeft") : cl.remove("anyLeft");
  allRight ? cl.add("allRight") : cl.remove("allRight");
  anyRight & !allRight ? cl.add("anyRight") : cl.remove("anyRight");
  //token.ref.current.classList.add(...annotatedTokenClass);

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

const showSelection = (tokens, selection) => {
  for (let token of tokens) {
    if (!token.ref?.current) continue;
    if (selection.length === 0 || selection[0] === null || selection[1] === null) {
      token.ref.current.classList.remove("selected");
      continue;
    }

    let [from, to] = selection;
    //if (to === null) return false;
    if (from > to) [to, from] = [from, to];
    let selected = token.arrayIndex >= from && token.arrayIndex <= to;
    if (selected && token.codingUnit) {
      token.ref.current.classList.add("selected");
    } else token.ref.current.classList.remove("selected");
  }
};

const AnnotationPopup = ({ tokens, currentToken, annotations, codeMap, fullScreenNode }) => {
  if (!tokens?.[currentToken]?.ref) return null;
  if (!annotations?.[tokens[currentToken].index]) return null;
  if (!codeMap) return null;
  const codes = Object.keys(annotations[tokens[currentToken].index]);

  return (
    <Popup
      mountNode={fullScreenNode || undefined}
      context={tokens?.[currentToken]?.ref}
      basic
      hoverable="false"
      position="top left"
      mouseLeaveDelay={0}
      open={true}
      style={{ padding: "0", border: "1px solid" }}
    >
      <List>
        {codes.map((code, i) => (
          <List.Item key={i} style={{ backgroundColor: getColor(code, codeMap), padding: "0.3em" }}>
            {code}
          </List.Item>
        ))}
      </List>
    </Popup>
  );
};

export default AnnotateNavigation;
