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
    return token.offset.index >= from && token.offset.index <= to;
  });

  let tokenClass = "token";
  if (selected) tokenClass = tokenClass + " selected";

  return (
    <span ref={ref} className={tokenClass} tokenindex={token.offset.index}>
      <AnnotatedToken token={token} selected={selected} />
    </span>
  );
});

const AnnotatedToken = ({ token, selected }) => {
  // If we specifically ask for the annotations for the current token within the
  // useSelector function, rerender is only triggered if this value has changed
  const annotations = useSelector(
    (state) => state.spanAnnotations[token.offset.index]
  );
  const csTrigger = useSelector((state) => {
    if (state.codeSelectorTrigger.index !== token.offset.index) return null;
    return state.codeSelectorTrigger.from;
  });

  const codes = useSelector((state) => state.codes);
  const dispatch = useDispatch();

  // This is a trick required to render if at least something within this token's
  // annotations changed (somehow 'annotations' doesn't trigger this)
  useSelector((state) =>
    JSON.stringify(state.spanAnnotations[token.offset.index])
  );

  // if there are no annotation codes, our life is easy
  if (!annotations) return <>{token.pre + token.text + token.post}</>;

  // create solid colors or color gradients
  const getColor = (tokenCode, codes) => {
    const codematch = codes.find((code) => code.code === tokenCode);
    if (codematch) {
      return codematch.color;
    } else {
      return "lightgrey";
    }
  };

  const tokenSpan = (annotatedTokenClass, color) => {
    return (
      <span
        className={annotatedTokenClass}
        onContextMenu={(e) => {
          e.preventDefault();
          dispatch(triggerCodeselector("right_click", token.offset.index));
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
    color = getColor(tokenCodes[0], codes);
  } else {
    let colors = tokenCodes.map((code) => getColor(code, codes));
    color = `linear-gradient(${colors.join(", ")})`;
  }

  // Set specific classes for nice css to show the start/end of codes
  const allLeft = !Object.values(annotations).some(
    (code) => code.span[0] !== code.index
  );
  const allRight = !Object.values(annotations).some(
    (code) => code.span[1] !== code.index
  );
  const anyLeft = Object.values(annotations).some(
    (code) => code.span[0] === code.index
  );
  const anyRight = Object.values(annotations).some(
    (code) => code.span[1] === code.index
  );

  let annotatedTokenClass = "annotatedToken";
  if (allLeft) annotatedTokenClass = annotatedTokenClass + " allLeft";
  if (anyLeft & !allLeft)
    annotatedTokenClass = annotatedTokenClass + " anyLeft";
  if (allRight) annotatedTokenClass = annotatedTokenClass + " allRight";
  if (anyRight & !allRight)
    annotatedTokenClass = annotatedTokenClass + " anyRight";

  if (selected) {
    color = null;
    annotatedTokenClass = annotatedTokenClass + " selected";
  }

  return (
    <>
      {allLeft ? token.pre : null}

      {csTrigger ? (
        <CodeSelector
          index={token.offset.index}
          annotations={annotations}
          csTrigger={csTrigger}
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
