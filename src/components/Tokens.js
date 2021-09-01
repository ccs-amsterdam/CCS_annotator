import React, { useEffect, useState, useRef } from "react";
import { Ref } from "semantic-ui-react";
import Token from "./Token";
import scrollToMiddle from "../util/scrollToMiddle";

const Tokens = ({ doc, item, contextUnit, height, textUnitPosition }) => {
  const [tokenComponents, setTokenComponents] = useState({});
  const containerRef = useRef(null);

  useEffect(() => {
    // immitates componentdidupdate to scroll to the textUnit after rendering tokens
    const firstTextUnitToken = doc.tokens.find(token => token.textPart === "textUnit");
    if (firstTextUnitToken?.ref?.current && containerRef.current) {
      scrollToMiddle(containerRef.current, firstTextUnitToken.ref.current, textUnitPosition);
    }
  });

  useEffect(() => {
    prepareTokens(doc, setTokenComponents, item, contextUnit);
  }, [doc, item, contextUnit]);

  if (doc === null) return null;

  const contextColor = "grey";

  return (
    <Ref innerRef={containerRef}>
      <div
        style={{
          width: "100%",
          height: `${height}vh`,
          overflow: "auto",
        }}
        textAlign="justified"
      >
        <div style={{ color: contextColor, paddingLeft: "0.5em", paddingRight: "0.5em" }}>
          {tokenComponents["contextBefore"]}
        </div>
        <div
          style={{
            borderTop: "2px solid",
            borderBottom: "2px solid",
            background: "#f7f7f78a",
            paddingLeft: "0.5em",
            paddingRight: "0.5em",
            lineHeight: 1.6,
            fontSize: 15,
          }}
        >
          {tokenComponents["textUnit"]}
        </div>
        <div
          style={{
            color: contextColor,
            paddingLeft: "0.5em",
            paddingRight: "0.5em",
            paddingBottom: `${height * (1 - textUnitPosition)}vh`,
          }}
        >
          {tokenComponents["contextAfter"]}
        </div>
      </div>
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
  const text = { contextBefore: [], textUnit: [], contextAfter: [] };
  let section = [];
  let paragraph = [];
  let sentence = [];
  let section_name = tokens[0].section;
  let paragraph_nr = tokens[0].paragraph;
  let sentence_nr = tokens[0].sentence;
  let currentParagraph = paragraph_nr;

  //let paragraphContext = [0, tokens[tokens.length - 1].paragraph];
  //let sentenceContext = [0, tokens[tokens.length - 1].sentence];
  let tokenRange = [0, tokens.length - 1];
  let tokenContext = [0, tokens.length - 1];

  if (item.textUnit === "paragraph") {
    tokenRange = getTokenRange(tokens, "paragraph", item.parIndex, item.parIndex);
  }
  if (item.textUnit === "sentence") {
    tokenRange = getTokenRange(tokens, "sentence", item.sentIndex, item.sentIndex);
  }

  if (contextUnit.selected !== "document")
    tokenContext = getContextRange(tokens, contextUnit, tokenRange);

  // textPart indicates if text is contextBefore, textUnit or contextAfter
  let textPart = tokenRange[0] === 0 ? "contextUnit" : "contextBefore";

  for (let i = 0; i < tokens.length; i++) {
    tokens[i].index = i;
    tokens[i].textPart = "textUnit";
    if (i < tokenRange[0]) tokens[i].textPart = "contextBefore";
    if (i > tokenRange[1]) tokens[i].textPart = "contextAfter";

    if (tokens[i].sentence !== sentence_nr) {
      if (sentence.length > 0) paragraph.push(renderSentence(i + "_" + sentence_nr, sentence));
      sentence = [];
    }
    if (tokens[i].paragraph !== paragraph_nr) {
      if (paragraph.length > 0) {
        section.push(
          renderParagraph(
            i + "_" + paragraph_nr,
            paragraph,
            paragraph_nr !== currentParagraph,
            tokens[i].paragraph !== paragraph_nr
          )
        );
        currentParagraph = tokens[i].paragraph;
      }
      paragraph = [];
    }

    if (tokens[i].section !== section_name) {
      if (section.length > 0)
        text[textPart].push(renderSection(i + "_" + section_name, section, section_name));
      section = [];
    }

    if (tokens[i].textPart !== textPart) {
      if (sentence.length > 0) paragraph.push(renderSentence(i + "_" + sentence_nr, sentence));
      if (paragraph.length > 0) {
        section.push(
          renderParagraph(
            i + "_" + paragraph_nr,
            paragraph,
            paragraph_nr !== currentParagraph,
            tokens[i].paragraph !== paragraph_nr
          )
        );
      }
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

    if (tokens[i].textPart === "textUnit") tokens[i].ref = React.createRef();
    sentence.push(renderToken(tokens[i], item.annotation));
  }
  if (sentence.length > 0) paragraph.push(renderSentence("last_" + sentence_nr, sentence));
  if (paragraph.length > 0)
    section.push(renderParagraph("last_" + paragraph_nr, paragraph, true, false));
  if (section.length > 0)
    text[textPart].push(renderSection("last_" + section_name, section, section_name));
  return text;
};

const getTokenRange = (tokens, field, startValue, endValue) => {
  const range = [0, tokens.length - 1];

  const start = tokens.find(token => token[field] === startValue);
  if (start) range[0] = start.index;
  const end = tokens.find(token => token[field] === endValue + 1);
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
  const fontstyle = paragraphs => {
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

const renderParagraph = (paragraph_nr, sentences, start, end) => {
  return (
    // uses span behaving like p, because p is not allowed due to nested div (for Label)
    <span
      className="paragraph"
      style={{
        marginTop: start ? "1em" : "0em",
        marginBottom: end ? "1em" : "0em",
        display: "table",
      }}
      key={paragraph_nr}
    >
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

const renderToken = (token, annotation) => {
  return <Token ref={token.ref} key={token.index} token={token} annotation={annotation} />;
};

export default React.memo(Tokens);
