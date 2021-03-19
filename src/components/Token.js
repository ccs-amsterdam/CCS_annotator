import React from "react";
import { useDispatch, useSelector } from "react-redux";
import { addSpanAnnotations, rmSpanAnnotations } from "../Actions";

import { Label } from "semantic-ui-react";

const Token = ({ token }) => {
  const spanAnnotations = useSelector((props) => props.spanAnnotations);
  const dispatch = useDispatch();

  // const onSelect = () => {
  //   console.log(token.offset.index);
  //   if (spanAnnotations.some((e) => e.offset === token.offset)) {
  //     dispatch(rmSpanAnnotation(token));
  //   } else {
  //     dispatch(addSpanAnnotation(token));
  //   }
  // };

  const addTag = (text, groups) => {
    return (
      <Label token style={{ margin: "0px" }} color="purple" horizontal>
        {text}
      </Label>
    );
  };

  return (
    <>
      {token.pre}
      <span className="token" tokenIndex={token.offset.index}>
        {spanAnnotations[token.offset.index]
          ? addTag(token.text, spanAnnotations[token.offset.index])
          : token.text}
      </span>

      {token.post}
    </>
  );
};

// {spanAnnotations.some((e) => e.offset.index === token.offset.index)
//   ? addTag(token.text)
//   : token.text}

export default Token;
