import React from "react";
import { useDispatch, useSelector } from "react-redux";
import "./style.css";

const Token = ({ token }) => {
  const spanAnnotations = useSelector((state) => state.spanAnnotations);
  const codes = useSelector((state) => state.codes);
  const code = useSelector((state) => state.code);

  const dispatch = useDispatch();

  const formatToken = (token, spanAnnotations) => {
    const tokenJsx = (text) => (
      <span
        className="token"
        tokenIndex={token.offset.index}
        tokenOffset={token.offset.start}
        tokenLength={token.offset.length}
      >
        {text}
      </span>
    );

    // if there are no annotation codes, our life is easy
    if (!spanAnnotations[token.offset.index])
      return <>{tokenJsx(token.pre + token.text + token.post)}</>;

    // otherwise, it gets a bit messy

    const getColor = (code, codes) => {
      const codematch = codes.find((e) => e.value === code);
      if (codematch) {
        return codematch.color;
      } else {
        return "lightgrey";
      }
    };

    // create solid colors or color gradients
    let tokenCodes = Object.keys(spanAnnotations[token.offset.index]);
    console.log(tokenCodes);
    let color = null;
    if (tokenCodes.length === 1) {
      color = getColor(tokenCodes[0], codes);
    } else {
      let colors = tokenCodes.map((code) => getColor(code, codes));
      color = `linear-gradient(${colors.join(", ")})`;
    }

    // check if at least one code has a token to the left or right (for the span borders)
    const spanFirst = !Object.values(spanAnnotations[token.offset.index]).some(
      (code) => code.span[0] !== code.index
    );
    const spanLast = !Object.values(spanAnnotations[token.offset.index]).some(
      (code) => code.span[1] !== code.index
    );

    return (
      <>
        {spanFirst ? token.pre : null}
        <span
          className="TextCodeBubble"
          style={{
            background: color,
            borderLeft: spanFirst ? "solid !important" : "none",
            borderRight: spanLast ? "solid !important" : "none",
          }}
        >
          {spanFirst && spanLast ? tokenJsx(token.text) : null}
          {spanFirst && !spanLast ? tokenJsx(token.text + token.post) : null}
          {spanLast && !spanFirst ? tokenJsx(token.pre + token.text) : null}
          {!spanFirst && !spanLast
            ? tokenJsx(token.pre + token.text + token.post)
            : null}
        </span>
        {spanLast ? token.post : null}
      </>
    );
  };

  return <>{formatToken(token, spanAnnotations)}</>;
};

export default Token;
