import React, { useState, useEffect } from "react";
import AnnotationEvents from "./AnnotationEvents";
import { Popup, List } from "semantic-ui-react";
import { getColor, getColorGradient } from "library/tokenDesign";

/**
 * The NavigationEvents component handles all eventlisteners
 * AnnotateNavigation furthermore takes the position and selection information
 * from the navigation to highlight the tokens and show popups
 */
const AnnotateNavigation = ({
  tokens,
  variableMap,
  annotations,
  triggerCodePopup,
  eventsBlocked,
  fullScreenNode,
  disableAnnotations,
}) => {
  const [currentToken, setCurrentToken] = useState(0);
  const [tokenSelection, setTokenSelection] = useState([]);

  useEffect(() => {
    if (!variableMap) return null;
    showAnnotations(tokens, annotations, variableMap);
  }, [tokens, annotations, variableMap]);

  useEffect(() => {
    showSelection(tokens, tokenSelection);
  }, [tokens, tokenSelection]);

  return (
    <>
      <AnnotationPopup
        tokens={tokens}
        currentToken={currentToken}
        annotations={annotations}
        variableMap={variableMap}
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

const showAnnotations = (tokens, annotations, variableMap) => {
  for (let token of tokens) {
    if (!token.ref?.current) continue;

    let tokenAnnotations = allowedAnnotations(annotations?.[token.index], variableMap);

    if (!tokenAnnotations || Object.keys(tokenAnnotations).length === 0) {
      if (token.ref.current.classList.contains("annotated")) {
        token.ref.current.classList.remove("annotated");
        setTokenColor(token, null, null, null);
      }
      continue;
    }
    annotateToken(token, tokenAnnotations, variableMap);
  }
};

const allowedAnnotations = (annotations, variableMap) => {
  if (!annotations) return null;

  if (annotations && variableMap) {
    annotations = { ...annotations };
    for (let variable of Object.keys(annotations)) {
      if (!variableMap[variable]) {
        delete annotations[variable];
        continue;
      }
      const codeMap = variableMap[variable].codeMap;
      const code = annotations[variable].value;
      if (!codeMap[code] || !codeMap[code].active || !codeMap[code].activeParent)
        delete annotations[variable];
    }
  }
  return annotations;
};

const annotateToken = (token, annotations, variableMap) => {
  // Set specific classes for nice css to show the start/end of codes
  let nLeft = 0;
  let nRight = 0;
  const colors = { pre: [], text: [], post: [] };
  for (let variable of Object.keys(variableMap)) {
    if (!annotations[variable]) {
      colors.text.push("#ffffff50");
      colors.pre.push("#ffffff50");
      colors.post.push("#ffffff50");
      continue;
    }
    const codeMap = variableMap[variable].codeMap;
    const code = annotations[variable];
    const color = getColor(code.value, codeMap);
    colors.text.push(color);
    if (code.span[0] === code.index) {
      nLeft++;
    } else colors.pre.push(color);
    if (code.span[1] === code.index) {
      nRight++;
    } else colors.post.push(color);
  }

  const allLeft = nLeft === Object.values(annotations).length;
  const allRight = nRight === Object.values(annotations).length;
  const anyLeft = nLeft > 0;
  const anyRight = nRight > 0;

  const cl = token.ref.current.classList;
  cl.add("annotated");
  allLeft ? cl.add("allLeft") : cl.remove("allLeft");
  anyLeft & !allLeft ? cl.add("anyLeft") : cl.remove("anyLeft");
  allRight ? cl.add("allRight") : cl.remove("allRight");
  anyRight & !allRight ? cl.add("anyRight") : cl.remove("anyRight");

  const textColor = getColorGradient(colors.text);
  const preColor = allLeft ? "white" : getColorGradient(colors.pre);
  const postColor = allRight ? "white" : getColorGradient(colors.post);
  setTokenColor(token, preColor, textColor, postColor);
  //setTokenLabels(token, ["test", "this"]);
};

// const setTokenLabels = (token, labels) => {
//   token.ref.current.style.lineHeight = `${labels.length * 1}em`;
//   token.ref.current.style.marginBottom = "-1em";
// };

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
    const cl = token.ref.current.classList;
    if (selected && token.codingUnit) {
      const left = from === token.arrayIndex;
      const right = to === token.arrayIndex;
      cl.add("selected");
      left ? cl.add("start") : cl.remove("start");
      right ? cl.add("end") : cl.remove("end");
    } else cl.remove("selected");
  }
};

const AnnotationPopup = ({ tokens, currentToken, annotations, variableMap, fullScreenNode }) => {
  if (!tokens?.[currentToken]?.ref) return null;
  if (!annotations?.[tokens[currentToken].index]) return null;
  if (!variableMap) return null;

  const tokenAnnotations = annotations[tokens[currentToken].index];
  const variables = Object.keys(tokenAnnotations);
  const codes = variables.map((variable) => tokenAnnotations[variable].value);

  return (
    <Popup
      mountNode={fullScreenNode || undefined}
      context={tokens?.[currentToken]?.ref}
      basic
      hoverable={false}
      position="top left"
      mouseLeaveDelay={1}
      open={true}
      style={{ margin: "0", padding: "0", border: "1px solid" }}
    >
      <List>
        {variables.map((variable, i) => {
          if (!variableMap[variable]) return null;
          return (
            <List.Item
              key={i}
              style={{
                backgroundColor: getColor(codes[i], variableMap[variable].codeMap),
                padding: "0.3em",
              }}
            >
              <b>{variable}</b>
              {": " + codes[i]}
            </List.Item>
          );
        })}
      </List>
    </Popup>
  );
};

export default AnnotateNavigation;
