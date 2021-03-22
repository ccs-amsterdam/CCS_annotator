import React from "react";
import { useSelector } from "react-redux";
import "./style.css";
import CodeSelector from "./CodeSelector";

const Token = ({ token }) => {
  console.log("token");

  return (
    <span
      className="token"
      tokenIndex={token.offset.index}
      tokenOffset={token.offset.start}
      tokenLength={token.offset.length}
    >
      <FancyToken token={token} />
    </span>
  );
};

const FancyToken = React.memo(({ token }) => {
  const spanAnnotations = useSelector((state) => state.spanAnnotations);
  const codes = useSelector((state) => state.codes);

  // if there are no annotation codes, our life is easy
  if (!spanAnnotations[token.offset.index])
    return <>{token.pre + token.text + token.post}</>;

  // otherwise, it gets a bit messy

  const getColor = (tokenCode, codes) => {
    const codematch = codes.find((e) => e.value === tokenCode);
    if (codematch) {
      return codematch.color;
    } else {
      return "lightgrey";
    }
  };

  // create solid colors or color gradients
  let tokenCodes = Object.keys(spanAnnotations[token.offset.index]);
  let color = null;
  if (tokenCodes.length === 1) {
    color = getColor(tokenCodes[0], codes);
  } else {
    let colors = tokenCodes.map((code) => getColor(code, codes));
    color = `linear-gradient(${colors.join(", ")})`;
  }

  // Set specific classes for nice css to show the start/end of codes
  const allLeft = !Object.values(spanAnnotations[token.offset.index]).some(
    (code) => code.span[0] !== code.index
  );
  const allRight = !Object.values(spanAnnotations[token.offset.index]).some(
    (code) => code.span[1] !== code.index
  );
  const anyLeft = Object.values(spanAnnotations[token.offset.index]).some(
    (code) => code.span[0] === code.index
  );
  const anyRight = Object.values(spanAnnotations[token.offset.index]).some(
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
