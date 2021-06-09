import React, { useEffect, useState } from "react";
import { Container } from "semantic-ui-react";
import Token from "./Token";

const Tokens = ({ doc, context, setTokenizedDoc }) => {
  // It's imporant that the annotations to not pass by this component
  // but are loaded into Token from redux. This prevents rerendering
  // all the parsing stuff
  const [tokenComponents, setTokenComponents] = useState(null);

  useEffect(() => {
    prepareTokens(doc, setTokenComponents, setTokenizedDoc, context);
  }, [doc, setTokenizedDoc, context]);

  if (doc === null) return null;

  return <Container textAlign="justified">{tokenComponents}</Container>;
};

const prepareTokens = async (doc, setTokenComponents, setTokenizedDoc, context) => {
  let tokens = doc.tokens;

  if (!tokens) return null;
  setTokenComponents(renderText(tokens, context));
  doc.tokens = tokens;
  setTokenizedDoc(doc);
};

const renderText = (tokens, context) => {
  const text = [];
  let paragraph = [];
  let sentence = [];
  let paragraph_nr = tokens[0].paragraph;
  let sentence_nr = tokens[0].sentence;
  let section = tokens[0].section;

  let tokenContext = [0, tokens.length - 1];
  let sentenceContext = [tokens[0].sentence, tokens[tokens.length - 1].sentence];

  if (context.span) {
    if (context.token_window) {
      tokenContext[0] = context.span[0] - context.token_window[0];
      tokenContext[1] = context.span[1] + context.token_window[1];
    }
    if (context.sentence_window) {
      sentenceContext[0] = tokens[context.span[0]].sentence - context.sentence_window[0];
      sentenceContext[1] = tokens[context.span[1]].sentence + context.sentence_window[1];
    }
  }

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

    if (i < tokenContext[0] || sentence_nr < sentenceContext[0]) continue;
    if (i > tokenContext[1] || sentence_nr > sentenceContext[1]) break;

    let highlight = context.span && i >= context.span[0] && i < context.span[1];

    tokens[i].index = i;
    tokens[i].ref = React.createRef();
    sentence.push(renderToken(tokens[i], highlight));
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

const renderToken = (token, highlight) => {
  return <Token ref={token.ref} key={token.index} token={token} highlight={highlight} />;
};

export default React.memo(Tokens);
