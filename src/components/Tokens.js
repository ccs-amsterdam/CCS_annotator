import React, { useEffect, useState } from "react";
import { Container } from "semantic-ui-react";
import Token from "./Token";
import db from "../apis/dexie";

import { parseTokens } from "../util/parseTokens";

const Tokens = ({ doc, setTokens }) => {
  // It's imporant that the annotations to not pass by this component
  // but are loaded into Token from redux. This prevents rerendering
  // all the parsing stuff
  const [tokenComponents, setTokenComponents] = useState(null);

  useEffect(() => {
    prepareTokens(doc, setTokenComponents, setTokens);
  }, [doc, setTokens]);

  if (doc === null) return null;

  return <Container textAlign="justified">{tokenComponents}</Container>;
};

const prepareTokens = async (doc, setTokenComponents, setTokens) => {
  let tokens = doc.tokens;

  if (tokens) {
    tokens = JSON.parse(tokens);
  } else {
    tokens = parseTokens({ title: doc.title, text: doc.text });
    await db.writeTokens(doc, tokens);
  }
  setTokenComponents(renderText(tokens));
  setTokens(tokens);
};

const renderText = tokens => {
  const text = [];
  let paragraph = [];
  let sentence = [];
  let paragraph_nr = 0;
  let sentence_nr = 0;
  for (let i = 0; i < tokens.length; i++) {
    if (tokens[i].paragraph !== paragraph_nr) {
      paragraph.push(renderSentence(sentence_nr, sentence));
      text.push(renderParagraph(paragraph_nr, paragraph));
      paragraph = [];
      sentence = [];
      paragraph_nr = tokens[i].paragraph;
      sentence_nr = tokens[i].sentence;
    }
    if (tokens[i].sentence !== sentence_nr) {
      paragraph.push(renderSentence(sentence_nr, sentence));
      sentence = [];
      sentence_nr = tokens[i].sentence;
    }

    tokens[i].ref = React.createRef();
    sentence.push(renderToken(tokens[i]));
  }
  paragraph.push(renderSentence(sentence_nr, sentence));
  text.push(renderParagraph(paragraph_nr, paragraph));

  return text;
};

const renderParagraph = (paragraph_nr, sentences) => {
  return (
    // uses span behaving like p, because p is not allowed due to nested div (for Label)
    <span style={{ marginTop: "1em", display: "table", lineHeight: 1.65 }} key={paragraph_nr}>
      {paragraph_nr === 0 ? <h2>{sentences}</h2> : sentences}
    </span>
  );
};

const renderSentence = (sentence_nr, tokens) => {
  return (
    <span className="sentence" key={sentence_nr}>
      {tokens}
    </span>
  );
};

const renderToken = token => {
  return <Token ref={token.ref} key={token.index} token={token} />;
};

export default React.memo(Tokens);
