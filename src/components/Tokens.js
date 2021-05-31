import React, { useEffect, useState } from "react";
import { Container } from "semantic-ui-react";
import Token from "./Token";
import db from "../apis/dexie";

import { parseTokens, safeTokens } from "../util/prepareTokens";

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
  tokens = safeTokens(tokens);
  if (!tokens) return null;
  setTokenComponents(renderText(tokens));
  setTokens(tokens);
};

const renderText = (tokens) => {
  const text = [];
  let paragraph = [];
  let sentence = [];
  let paragraph_nr = tokens[0].paragraph;
  let sentence_nr = tokens[0].sentence;
  let section = tokens[0].section;
  for (let i = 0; i < tokens.length; i++) {
    if (tokens[i].paragraph !== paragraph_nr) {
      paragraph.push(renderSentence(section + sentence_nr, sentence));
      text.push(renderParagraph(section + paragraph_nr, paragraph, section));
      paragraph = [];
      sentence = [];
      paragraph_nr = tokens[i].paragraph;
      sentence_nr = tokens[i].sentence;
      section = tokens[i].section;
    }
    if (tokens[i].sentence !== sentence_nr) {
      paragraph.push(renderSentence(section + sentence_nr, sentence));
      sentence = [];
      sentence_nr = tokens[i].sentence;
    }

    tokens[i].index = i;
    tokens[i].ref = React.createRef();
    sentence.push(renderToken(tokens[i]));
  }
  paragraph.push(renderSentence(section + sentence_nr, sentence));
  text.push(renderParagraph(section + paragraph_nr, paragraph, section));

  return text;
};

const renderParagraph = (paragraph_nr, sentences, section) => {
  return (
    // uses span behaving like p, because p is not allowed due to nested div (for Label)
    <span style={{ marginTop: "1em", display: "table", lineHeight: 1.65 }} key={paragraph_nr}>
      {section === "title" ? <h2>{sentences}</h2> : sentences}
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

const renderToken = (token) => {
  return <Token ref={token.ref} key={token.index} token={token} />;
};

export default React.memo(Tokens);
