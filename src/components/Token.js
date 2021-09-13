import React from "react";
import { useDispatch, useSelector } from "react-redux";

import "./style.css";
import CodeSelector from "./CodeSelector";
import { triggerCodeselector } from "../actions";
import { getColor } from "../util/tokenDesign";
import { List, Popup } from "semantic-ui-react";

const Token = React.forwardRef(({ token, annotation }, ref) => {
  const selected = useSelector(state => {
    if (state.tokenSelection.length === 0) return false;

    let [from, to] = state.tokenSelection;
    if (from > to) [to, from] = [from, to];
    return token.arrayIndex >= from && token.arrayIndex <= to;
  });

  let tokenClass = "token";

  if (token.textPart === "textUnit") {
    if (selected) tokenClass = tokenClass + " selected";
    if (annotation) {
      if (token.index >= annotation.span[0] && token.index <= annotation.span[1])
        tokenClass += " highlight";
    }
  }

  return (
    <span ref={ref} className={tokenClass} tokenindex={token.arrayIndex}>
      <AnnotatedToken token={token} selected={selected} />
    </span>
  );
});

const AnnotatedToken = ({ token, selected }) => {
  // If we specifically ask for the annotations for the current token within the
  // useSelector function, rerender is only triggered if this value has changed

  let annotations = useSelector(state => state.spanAnnotations[token.index]);

  const csTrigger = useSelector(state => {
    if (state.codeSelectorTrigger.index !== token.index) return null;
    return state.codeSelectorTrigger;
  });
  const codeMap = useSelector(state => state.codeMap);
  const dispatch = useDispatch();

  // This is a trick required to render if at least something within this token's
  // annotations changed (somehow 'annotations' doesn't trigger this)
  useSelector(state => JSON.stringify(state.spanAnnotations[token.index]));

  if (annotations) {
    annotations = { ...annotations };
    for (let code of Object.keys(annotations)) {
      if (!codeMap[code]) continue;
      if (!codeMap[code] || !codeMap[code].active || !codeMap[code].activeParent)
        delete annotations[code];
    }
  }

  // if there are no annotation codes, our life is easy
  if (!annotations || Object.keys(annotations).length === 0)
    return <>{token.pre + token.text + token.post}</>;

  // if this is a context token, we can also ignore the fancy stuff
  if (token.textPart !== "textUnit") return <>{token.pre + token.text + token.post}</>;

  const tokenSpan = (annotatedTokenClass, color) => {
    return (
      <span
        className={annotatedTokenClass}
        onContextMenu={e => {
          e.preventDefault();
          dispatch(triggerCodeselector("right_click", token.index, null));
        }}
        style={
          color
            ? {
                background: color,
              }
            : null
        }
      >
        {allLeft && allRight ? token.text : null}
        {allLeft && !allRight ? token.text + token.post : null}
        {allRight && !allLeft ? token.pre + token.text : null}
        {!allLeft && !allRight ? token.pre + token.text + token.post : null}
      </span>
    );
  };

  let tokenCodes = Object.keys(annotations);
  let color = null;
  let colors = tokenCodes.map(code => getColor(code, codeMap));

  if (tokenCodes.length === 1) {
    color = colors[0];
  } else {
    const pct = Math.floor(100 / colors.length);
    const gradColors = colors.reduce((a, color, i) => {
      if (i === 0) a.push(color + ` ${pct}%`);
      if (i === colors.length - 1) a.push(color + ` ${100 - pct}%`);

      if (i > 0 && i < colors.length - 1) {
        a.push(color + ` ${pct * i}%`);
        a.push(color + ` ${pct * (i + 1)}%`);
      }
      return a;
    }, []);

    color = `linear-gradient(to bottom, ${gradColors.join(", ")})`;
  }

  // Set specific classes for nice css to show the start/end of codes
  const allLeft = !Object.values(annotations).some(code => code.span[0] !== code.index);
  const allRight = !Object.values(annotations).some(code => code.span[1] !== code.index);
  const anyLeft = Object.values(annotations).some(code => code.span[0] === code.index);
  const anyRight = Object.values(annotations).some(code => code.span[1] === code.index);

  let annotatedTokenClass = "annotatedToken";
  if (allLeft) annotatedTokenClass = annotatedTokenClass + " allLeft";
  if (anyLeft & !allLeft) annotatedTokenClass = annotatedTokenClass + " anyLeft";
  if (allRight) annotatedTokenClass = annotatedTokenClass + " allRight";
  if (anyRight & !allRight) annotatedTokenClass = annotatedTokenClass + " anyRight";

  if (selected) {
    color = null;
    annotatedTokenClass = annotatedTokenClass + " selected";
  }

  return (
    <>
      {allLeft ? token.pre : null}

      {csTrigger ? (
        <CodeSelector
          annotations={annotations}
          currentCode={csTrigger.code}
          newSelection={csTrigger.from === "new_selection"}
        >
          {tokenSpan(annotatedTokenClass, color)}
        </CodeSelector>
      ) : (
        <ShowCodeOnHover codes={tokenCodes} colors={colors}>
          {tokenSpan(annotatedTokenClass, color)}
        </ShowCodeOnHover>
      )}

      {allRight ? token.post : null}
    </>
  );
};

const ShowCodeOnHover = ({ codes, colors, children }) => {
  return (
    <Popup trigger={children} style={{ padding: "0.3em", paddingBottom: "0.5em" }}>
      <List>
        {codes.map((code, i) => (
          <List.Item key={i} style={{ backgroundColor: colors[i], padding: "0.3em" }}>
            {code}
          </List.Item>
        ))}
      </List>
    </Popup>
  );
};

export default React.memo(Token);
