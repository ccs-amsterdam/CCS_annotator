import React from "react";
import { useDispatch, useSelector } from "react-redux";

import "./style.css";
import CodeSelector from "./CodeSelector";
import { triggerCodeselector } from "../actions";

const Token = React.forwardRef(({ token }, ref) => {
  const selected = useSelector((state) => {
    if (state.tokenSelection.length === 0) return false;

    let [from, to] = state.tokenSelection;
    if (from > to) [to, from] = [from, to];
    return token.index >= from && token.index <= to;
  });

  let tokenClass = "token";
  if (selected) tokenClass = tokenClass + " selected";

  return (
    <span ref={ref} className={tokenClass} tokenindex={token.index}>
      <AnnotatedToken token={token} selected={selected} />
    </span>
  );
});

const AnnotatedToken = ({ token, selected }) => {
  // If we specifically ask for the annotations for the current token within the
  // useSelector function, rerender is only triggered if this value has changed
  const annotations = useSelector((state) => state.spanAnnotations[token.index]);
  const csTrigger = useSelector((state) => {
    if (state.codeSelectorTrigger.index !== token.index) return null;
    return state.codeSelectorTrigger;
  });
  const codeMap = useSelector((state) => state.codeMap);
  const dispatch = useDispatch();

  // This is a trick required to render if at least something within this token's
  // annotations changed (somehow 'annotations' doesn't trigger this)
  useSelector((state) => JSON.stringify(state.spanAnnotations[token.index]));

  // if there are no annotation codes, our life is easy
  if (!annotations) return <>{token.pre + token.text + token.post}</>;

  // create solid colors or color gradients
  const getColor = (tokenCode, codeMap) => {
    if (codeMap[tokenCode]) {
      return codeMap[tokenCode].color;
    } else {
      return "white";
    }
  };

  const tokenSpan = (annotatedTokenClass, color) => {
    return (
      <span
        className={annotatedTokenClass}
        onContextMenu={(e) => {
          e.preventDefault();
          dispatch(triggerCodeselector("right_click", token.index, null));
        }}
        style={color ? { background: color } : null}
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
  if (tokenCodes.length === 1) {
    color = getColor(tokenCodes[0], codeMap);
  } else {
    let colors = tokenCodes.map((code) => getColor(code, codeMap));
    color = `linear-gradient(${colors.join(", ")})`;
  }

  // Set specific classes for nice css to show the start/end of codes
  const allLeft = !Object.values(annotations).some((code) => code.span[0] !== code.index);
  const allRight = !Object.values(annotations).some((code) => code.span[1] !== code.index);
  const anyLeft = Object.values(annotations).some((code) => code.span[0] === code.index);
  const anyRight = Object.values(annotations).some((code) => code.span[1] === code.index);

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
        tokenSpan(annotatedTokenClass, color)
      )}

      {allRight ? token.post : null}
    </>
  );
};

export default React.memo(Token);
