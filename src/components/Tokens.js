import React, { useEffect, useState } from "react";
import { Container } from "semantic-ui-react";
import Token from "./Token";

const Tokens = ({ doc, item, contextUnit }) => {
  // It's imporant that the annotations to not pass by this component
  // but are loaded into Token from redux. This prevents rerendering
  // all the parsing stuff
  const [tokenComponents, setTokenComponents] = useState(null);

  useEffect(() => {
    prepareTokens(doc, setTokenComponents, item, contextUnit);
  }, [doc, item, contextUnit]);

  if (doc === null) return null;

  return (
    <Container style={{ width: "95%" }} textAlign="justified">
      {tokenComponents}
    </Container>
  );
};

const prepareTokens = async (doc, setTokenComponents, item, contextUnit) => {
  let tokens = doc.tokens;

  if (!tokens) return null;
  setTokenComponents(renderText(tokens, item, contextUnit));
  doc.tokens = tokens;
};

const renderText = (tokens, item, contextUnit) => {
  const text = [];
  let paragraph = [];
  let sentence = [];
  let paragraph_nr = tokens[0].paragraph;
  let sentence_nr = tokens[0].sentence;
  let section = tokens[0].section;

  //let paragraphContext = [0, tokens[tokens.length - 1].paragraph];
  //let sentenceContext = [0, tokens[tokens.length - 1].sentence];
  let tokenRange = [0, tokens.length - 1];
  let tokenContext = [0, tokens.length - 1];

  if (item.parIndex != null && item.parIndex !== null) {
    // if coding unit is paragraph
    //paragraphContext = [item.parIndex, item.parIndex];
    tokenRange = getTokenRange(tokens, "paragraph", item.parIndex, item.parIndex);
  }
  if (item.sentIndex != null && item.sentIndex !== null) {
    tokenRange = getTokenRange(tokens, "sentence", item.sentIndex, item.sentIndex);
    // if coding unit is sentence
  }
  if (item.annotationIndex != null && item.annotationIndex !== null) {
    // if coding unit is annotation
    tokenRange = [item.annotationIndex[0], item.annotationIndex[1]];
  }

  if (contextUnit.selected !== "document")
    tokenContext = getContextRange(tokens, contextUnit, tokenRange);

  // if coding unit is document
  const documentIsUnit =
    item.parIndex == null && item.sentIndex == null && item.annotationIndex == null;

  for (let i = 0; i < tokens.length; i++) {
    if (tokens[i].paragraph !== paragraph_nr) {
      if (sentence.length > 0) paragraph.push(renderSentence(section + sentence_nr, sentence));
      if (paragraph.length > 0)
        text.push(
          renderParagraph(section + "_" + paragraph_nr, paragraph, section, documentIsUnit)
        );
      paragraph = [];
      sentence = [];
      paragraph_nr = tokens[i].paragraph;
      sentence_nr = tokens[i].sentence;
      section = tokens[i].section;
    }
    if (tokens[i].sentence !== sentence_nr) {
      if (sentence.length > 0) paragraph.push(renderSentence(section + sentence_nr, sentence));
      sentence = [];
      sentence_nr = tokens[i].sentence;
    }

    tokens[i].index = i;
    tokens[i].isContext = i < tokenRange[0] || i > tokenRange[1];
    if (i < tokenContext[0]) continue;
    if (i > tokenContext[1]) break;

    tokens[i].ref = React.createRef();
    sentence.push(renderToken(tokens[i]));
  }
  if (sentence.length > 0) paragraph.push(renderSentence(section + sentence_nr, sentence));
  if (paragraph.length > 0) text.push(renderParagraph(section + paragraph_nr, paragraph, section));

  return text;
};

const getTokenRange = (tokens, field, startValue, endValue) => {
  const range = [0, tokens.length - 1];

  const start = tokens.find((token) => token[field] === startValue);
  if (start) range[0] = start.index;
  const end = tokens.find((token) => token[field] === endValue + 1);
  if (end) range[1] = end.index - 1;

  return range;
};

const getContextRange = (tokens, contextUnit, tokenRange) => {
  const field = contextUnit.selected;
  let range = [tokens[tokenRange[0]][field], tokens[tokenRange[1]][field]];
  range[0] = range[0] - contextUnit.range[contextUnit.selected][0];
  range[1] = range[1] + contextUnit.range[contextUnit.selected][1];
  return getTokenRange(tokens, field, range[0], range[1]);
};

const renderParagraph = (paragraph_nr, sentences, section, documentIsUnit) => {
  const fontstyle = (sentences) => {
    //if (!documentIsUnit) return sentences;
    if (section === "title") return <h2>{sentences}</h2>;
    return sentences;
  };

  return (
    // uses span behaving like p, because p is not allowed due to nested div (for Label)
    <span style={{ marginTop: "1em", display: "table", lineHeight: 1.65 }} key={paragraph_nr}>
      {fontstyle(sentences)}
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
