import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { addSpanAnnotation, rmSpanAnnotation } from "../Actions";

import { Container, Label } from "semantic-ui-react";

import nlp from "compromise";
import paragraphs from "compromise-paragraphs";
nlp.extend(paragraphs);

const Tokens = ({ text }) => {
  // move the onmouseup logic to annotate. keep Tokens clean for setting up the text
  // also think of how we can get the event functions out of the tokens component.
  // can we pass the onClick function for tokens as a prop, so taht we can change it for different annotating jobs?
  // (this should be possible. But maybe we can also do this via redux)
  const onMouseUp = () => {
    const selection = window.getSelection();
    const from = selection.anchorNode.parentElement;
    const to = selection.focusNode.parentElement;

    if (!(from.className === "token" && to.className === "token")) {
      window.getSelection().empty();
      return null;
    }
    console.log("hoe dan");
    console.log(from.getAttribute("offset"));
    console.log(to.getAttribute("offset"));
  };

  useEffect(() => {
    document.body.addEventListener("mouseup", onMouseUp);
    return () => {
      document.body.removeEventListener("mouseup", onMouseUp);
    };
  });

  const prepareTokens = (text) => {
    const paragraphs = nlp.tokenize(text).paragraphs().json({ offset: true });
    return paragraphs.map((par, par_i) => {
      return <Paragraph par={par} par_i={par_i} />;
    });
  };

  if (text === null) return null;
  return <Container text>{prepareTokens(text)}</Container>;
};

const Paragraph = ({ par, par_i }) => {
  const mapSentences = (par, par_i) => {
    let sent_i = -1;
    return par.sentences.map((sent) => {
      // for some reason there's an other array layer...
      // I've only found cases where lenght is 1, but I'll map just in case
      return sent.map((sent2) => {
        sent_i += 1;
        return <Sentence sent={sent2} par_i={par_i} sent_i={sent_i} />;
      });
    });
  };
  return <p key={par_i}>{mapSentences(par, par_i)}</p>;
};

const Sentence = ({ sent, par_i, sent_i }) => {
  const mapTokens = (sent, sent_i) => {
    return sent.terms.map((token, token_i) => {
      return (
        <Token token={token} par_i={par_i} sent_i={sent_i} token_i={token_i} />
      );
    });
  };
  return (
    <span className="sentence" key={par_i.toString() + "." + sent_i.toString()}>
      {mapTokens(sent, sent_i)}
    </span>
  );
};

const Token = ({ token, par_i, sent_i, token_i }) => {
  const spanAnnotations = useSelector((props) => props.spanAnnotations);
  const dispatch = useDispatch();

  const onSelect = () => {
    if (spanAnnotations.some((e) => e.offset === token.offset)) {
      dispatch(rmSpanAnnotation(token));
    } else {
      dispatch(addSpanAnnotation(token));
    }
  };

  const addTag = (text) => {
    return (
      <>
        <Label style={{ margin: "0px" }} color="purple" horizontal>
          {text}
        </Label>
      </>
    );
  };

  return (
    <span>
      {token.pre}
      <span
        className="token"
        onClick={onSelect}
        offset={token.offset}
        key={
          par_i.toString() + "." + sent_i.toString() + "." + token_i.toString()
        }
      >
        {spanAnnotations.some((e) => e.offset.index === token.offset.index)
          ? addTag(token.text)
          : token.text}
      </span>
      {token.post}
    </span>
  );
};

export default Tokens;
