import React from "react";
import { useSelector } from "react-redux";
import "./style.css";
import CodeSelector from "./CodeSelector";

const Token = ({ token }) => {
  return (
    <span
      className="token"
      tokenindex={token.offset.index}
      tokenoffset={token.offset.start}
      tokenlength={token.offset.length}
    >
      <FancyToken token={token} />
    </span>
  );
};

const FancyToken = React.memo(({ token }) => {
  // If we specifically ask for the annotations for the current token within the
  // useSelector function, rerender is only triggered if this value has changed
  const annotations = useSelector(
    (state) => state.spanAnnotations[token.offset.index]
  );
  const codes = useSelector((state) => state.codes);

  // This is a trick required to render if at least something within this token's
  // annotations changed (somehow 'annotations' doesn't trigger this, even though it
  // does contain all the information)
  useSelector((state) =>
    JSON.stringify(state.spanAnnotations[token.offset.index])
  );

  // if there are no annotation codes, our life is easy
  if (!annotations) return <>{token.pre + token.text + token.post}</>;

  // create solid colors or color gradients
  const getColor = (tokenCode, codes) => {
    const codematch = codes.find((e) => e.value === tokenCode);
    if (codematch) {
      return codematch.color;
    } else {
      return "lightgrey";
    }
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

  let tokenClass = "TextCodeBubble";
  if (allLeft) tokenClass = tokenClass + " allLeft";
  if (anyLeft & !allLeft) tokenClass = tokenClass + " anyLeft";
  if (allRight) tokenClass = tokenClass + " allRight";
  if (anyRight & !allRight) tokenClass = tokenClass + " anyRight";

  return (
    <>
      {allLeft ? token.pre : null}
      <CodeSelector index={token.offset.index}>
        <span
          className={tokenClass}
          style={{
            background: color,
          }}
        >
          {allLeft && allRight ? token.text : null}
          {allLeft && !allRight ? token.text + token.post : null}
          {allRight && !allLeft ? token.pre + token.text : null}
          {!allLeft && !allRight ? token.pre + token.text + token.post : null}
        </span>
      </CodeSelector>
      {allRight ? token.post : null}
    </>
  );
});

export default React.memo(Token);
