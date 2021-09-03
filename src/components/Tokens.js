import React, { useEffect, useState, useRef } from "react";
import { Ref } from "semantic-ui-react";
import Token from "./Token";

import { scrollToMiddle } from "../util/scroll";

const Tokens = ({ doc, height, textUnitPosition }) => {
  const [tokenComponents, setTokenComponents] = useState({});
  const containerRef = useRef(null);

  useEffect(() => {
    // immitates componentdidupdate to scroll to the textUnit after rendering tokens
    const firstTextUnitToken = doc.tokens.find((token) => token.textPart === "textUnit");
    if (firstTextUnitToken?.ref?.current && containerRef.current) {
      scrollToMiddle(containerRef.current, firstTextUnitToken.ref.current, textUnitPosition);
    }
  });

  useEffect(() => {
    prepareTokens(doc, setTokenComponents);
  }, [doc]);

  if (doc === null) return null;

  const contextColor = "grey";

  return (
    <Ref innerRef={containerRef}>
      <div
        style={{
          width: "100%",
          height: `${height}vh`,
          overflowY: "auto",
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
            paddingBottom: `${0.8 * height * (1 - textUnitPosition)}vh`,
          }}
        >
          {tokenComponents["contextAfter"]}
        </div>
      </div>
    </Ref>
  );
};

const prepareTokens = async (doc, setTokenComponents) => {
  if (!doc.tokens) return null;
  setTokenComponents(renderText(doc.tokens, doc.itemAnnotation));
  // assignment by reference: renderText also adds a react ref to each token in doc.tokens
};

const renderText = (tokens, itemAnnotation) => {
  const text = { contextBefore: [], textUnit: [], contextAfter: [] };

  let section = [];
  let paragraph = [];
  let sentence = [];
  let textPart = tokens[0].textPart;
  let section_name = tokens[0].section;
  let paragraph_nr = tokens[0].paragraph;
  let sentence_nr = tokens[0].sentence;
  let currentParagraph = paragraph_nr;

  //let paragraphContext = [0, tokens[tokens.length - 1].paragraph];
  //let sentenceContext = [0, tokens[tokens.length - 1].sentence];

  for (let i = 0; i < tokens.length; i++) {
    tokens[i].arrayIndex = i;

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

    if (tokens[i].textPart === "textUnit") tokens[i].ref = React.createRef();
    sentence.push(renderToken(tokens[i], itemAnnotation));
  }
  if (sentence.length > 0) paragraph.push(renderSentence("last_" + sentence_nr, sentence));
  if (paragraph.length > 0)
    section.push(renderParagraph("last_" + paragraph_nr, paragraph, true, false));
  if (section.length > 0)
    text[textPart].push(renderSection("last_" + section_name, section, section_name));
  return text;
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

const renderParagraph = (paragraph_nr, sentences, start, end) => {
  return (
    // uses span behaving like p, because p is not allowed due to nested div (for Label)
    <span
      className="paragraph"
      style={{
        paddingBottom: end ? "1.5em" : "0em",
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
