import React, { useEffect, useState, useRef } from "react";
import { Container, Ref } from "semantic-ui-react";
import Token from "./Token";
import scrollToMiddle from "../util/scrollToMiddle";

const Tokens = ({ doc, item, contextUnit, height, codingUnitPosition }) => {
  const [tokenComponents, setTokenComponents] = useState({});
  const containerRef = useRef(null);

  useEffect(() => {
    // immitates componentdidupdate to scroll to the codingUnit after rendering tokens
    const firstCodingUnitToken = doc.tokens.find((token) => token.textPart === "codingUnit");
    if (firstCodingUnitToken?.ref?.current && containerRef.current) {
      scrollToMiddle(containerRef.current, firstCodingUnitToken.ref.current, codingUnitPosition);
    }
  });

  useEffect(() => {
    prepareTokens(doc, setTokenComponents, item, contextUnit);
  }, [doc, item, contextUnit]);

  if (doc === null) return null;

  const contextColor = "grey";

  return (
    <Ref innerRef={containerRef}>
      <Container
        style={{ width: "99%", paddingRight: "0%", height: `${height}vh`, overflow: "scroll" }}
        textAlign="justified"
      >
        <div style={{ color: contextColor, paddingLeft: "0.5em", paddingRight: "0.5em" }}>
          {tokenComponents["contextBefore"]}
        </div>
        <div
          style={{
            borderTop: "2px solid",
            borderBottom: "2px solid",
            background: "#f2f2f28a",
            paddingLeft: "0.5em",
            paddingRight: "0.5em",
            lineHeight: 1.6,
            fontSize: 15,
          }}
        >
          {tokenComponents["codingUnit"]}
        </div>
        <div
          style={{
            color: contextColor,
            paddingLeft: "0.5em",
            paddingRight: "0.5em",
            paddingBottom: `${height * (1 - codingUnitPosition)}vh`,
          }}
        >
          {tokenComponents["contextAfter"]}
        </div>
      </Container>
    </Ref>
  );
};

const prepareTokens = async (doc, setTokenComponents, item, contextUnit) => {
  let tokens = doc.tokens;

  if (!tokens) return null;
  setTokenComponents(renderText(tokens, item, contextUnit));
  doc.tokens = tokens;
};

const renderText = (tokens, item, contextUnit) => {
  const text = { contextBefore: [], codingUnit: [], contextAfter: [] };
  let section = [];
  let paragraph = [];
  let sentence = [];
  let section_name = tokens[0].section;
  let paragraph_nr = tokens[0].paragraph;
  let sentence_nr = tokens[0].sentence;

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
    // if coding unit is sentence
    tokenRange = getTokenRange(tokens, "sentence", item.sentIndex, item.sentIndex);
  }
  if (item.annotationIndex != null && item.annotationIndex !== null) {
    // if coding unit is annotation
    tokenRange = [item.annotationIndex[0], item.annotationIndex[1]];
  }

  if (contextUnit.selected !== "document")
    tokenContext = getContextRange(tokens, contextUnit, tokenRange);

  // textPart indicates if text is contextBefore, codingUnit or contextAfter
  let textPart = tokenRange[0] === 0 ? "contextUnit" : "contextBefore";

  for (let i = 0; i < tokens.length; i++) {
    tokens[i].index = i;
    tokens[i].textPart = "codingUnit";
    if (i < tokenRange[0]) tokens[i].textPart = "contextBefore";
    if (i > tokenRange[1]) tokens[i].textPart = "contextAfter";

    if (tokens[i].sentence !== sentence_nr) {
      if (sentence.length > 0) paragraph.push(renderSentence(i + "_" + sentence_nr, sentence));
      sentence = [];
    }
    if (tokens[i].paragraph !== paragraph_nr) {
      if (paragraph.length > 0) section.push(renderParagraph(i + "_" + paragraph_nr, paragraph));
      paragraph = [];
    }
    if (tokens[i].section !== section_name) {
      if (section.length > 0)
        text[textPart].push(renderSection(i + "_" + section_name, section, section_name));
      section = [];
    }
    if (tokens[i].textPart !== textPart) {
      if (sentence.length > 0) paragraph.push(renderSentence(i + "_" + sentence_nr, sentence));
      if (paragraph.length > 0) section.push(renderParagraph(i + "_" + paragraph_nr, paragraph));
      if (section.length > 0)
        text[textPart].push(renderSection(i + "_" + section_name, section, section_name));
      section = [];
      paragraph = [];
      sentence = [];
    }

    paragraph_nr = tokens[i].paragraph;
    sentence_nr = tokens[i].sentence;
    section_name = tokens[i].section;
    textPart = tokens[i].textPart;

    if (i < tokenContext[0]) continue;
    if (i > tokenContext[1]) break;

    if (tokens[i].textPart === "codingUnit") tokens[i].ref = React.createRef();
    sentence.push(renderToken(tokens[i]));
  }
  if (sentence.length > 0) paragraph.push(renderSentence("last_" + sentence_nr, sentence));
  if (paragraph.length > 0) section.push(renderParagraph("last_" + paragraph_nr, paragraph));
  if (section.length > 0)
    text[textPart].push(renderSection("last_" + section_name, section, section_name));
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

const renderSection = (paragraph_nr, paragraphs, section) => {
  const fontstyle = (paragraphs) => {
    if (section === "title") return <h2>{paragraphs}</h2>;
    return paragraphs;
  };

  return (
    // uses span behaving like p, because p is not allowed due to nested div (for Label)
    <span className="section" key={paragraph_nr}>
      {fontstyle(paragraphs)}
    </span>
  );
};

const renderParagraph = (paragraph_nr, sentences) => {
  return (
    // uses span behaving like p, because p is not allowed due to nested div (for Label)
    <span className="paragraph" style={{ marginTop: "1em", display: "table" }} key={paragraph_nr}>
      {sentences}
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
