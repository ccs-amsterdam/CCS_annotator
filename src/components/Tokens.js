import React, { useEffect, useState } from "react";
import { Container } from "semantic-ui-react";
import Token from "./Token";

const Tokens = ({ doc, item, contextUnit }) => {
  // It's imporant that the annotations to not pass by this component
  // but are loaded into Token from redux. This prevents rerendering
  // all the parsing stuff
  const [tokenComponents, setTokenComponents] = useState(null);

  useEffect(() => {
    console.log(item);
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

  let paragraphContext = [0, tokens[tokens.length - 1].paragraph];
  let sentenceContext = [0, tokens[tokens.length - 1].sentence];
  let tokenContext = [0, tokens.length - 1];

  if (item.parIndex != null && item.parIndex !== null) {
    paragraphContext = [item.parIndex, item.parIndex];
  }
  if (item.sentIndex != null && item.sentIndex !== null) {
    sentenceContext = [item.sentIndex, item.sentIndex];
    const inParagraph = tokens.find((token) => token.sentence === item.sentIndex);
    paragraphContext = [inParagraph.paragraph, inParagraph.paragraph];
  }
  if (item.annotationIndex != null && item.annotationIndex !== null) {
    tokenContext = [item.annotationIndex[0], item.annotationIndex[1]];
    const annotationStart = tokens[item.annotationIndex[0]];
    const annotationEnd = tokens[item.annotationIndex[1]];
    paragraphContext = [annotationStart.paragraph, annotationEnd.paragraph];
    sentenceContext = [annotationStart.sentence, annotationEnd.sentence];
  }

  const documentIsUnit =
    item.parIndex == null && item.sentIndex == null && item.annotationIndex == null;

  if (!documentIsUnit && contextUnit !== "document") {
  }
  // if (context.span) {
  //   if (context.token_window) {
  //     tokenContext[0] = context.span[0] - context.token_window[0];
  //     tokenContext[1] = context.span[1] + context.token_window[1];
  //   }
  //   if (context.sentence_window) {
  //     sentenceContext[0] = tokens[context.span[0]].sentence - context.sentence_window[0];
  //     sentenceContext[1] = tokens[context.span[1]].sentence + context.sentence_window[1];
  //   }
  // }

  for (let i = 0; i < tokens.length; i++) {
    if (tokens[i].paragraph !== paragraph_nr) {
      if (sentence.length > 0) paragraph.push(renderSentence(section + sentence_nr, sentence));
      if (paragraph.length > 0)
        text.push(renderParagraph(section + paragraph_nr, paragraph, section, documentIsUnit));
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

    if (
      i < tokenContext[0] ||
      sentence_nr < sentenceContext[0] ||
      paragraph_nr < paragraphContext[0]
    )
      continue;
    if (
      i > tokenContext[1] ||
      sentence_nr > sentenceContext[1] ||
      paragraph_nr > paragraphContext[1]
    )
      break;

    //let highlight = context.span && i >= context.span[0] && i < context.span[1];

    tokens[i].index = i;
    tokens[i].ref = React.createRef();
    sentence.push(renderToken(tokens[i]));
  }
  if (sentence.length > 0) paragraph.push(renderSentence(section + sentence_nr, sentence));
  if (paragraph.length > 0) text.push(renderParagraph(section + paragraph_nr, paragraph, section));

  return text;
};

const renderParagraph = (paragraph_nr, sentences, section, documentIsUnit) => {
  const fontstyle = (sentences) => {
    if (!documentIsUnit) return sentences;
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

const renderToken = (token, highlight) => {
  return <Token ref={token.ref} key={token.index} token={token} highlight={highlight} />;
};

export default React.memo(Tokens);
