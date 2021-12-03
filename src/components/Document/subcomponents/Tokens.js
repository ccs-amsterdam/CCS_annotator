import React, { useEffect, useRef, useState } from "react";
import { Ref } from "semantic-ui-react";
import { scrollToMiddle } from "library/scroll";

import "components/Document/subcomponents/spanAnnotationsStyle.css";
import Meta from "./Meta";

const Tokens = ({ tokens, text_fields, meta_fields, setReady, height }) => {
  const [text, setText] = useState({});
  const containerRef = useRef(null);

  useEffect(() => {
    // immitates componentdidupdate to scroll to the textUnit after rendering tokens
    const firstTextUnitToken = tokens.find((token) => token.codingUnit);
    const hasContext = tokens.some((token) => !token.codingUnit);
    if (!hasContext) {
      containerRef.current.scrollTop = 0;
      return;
    }
    if (firstTextUnitToken?.ref?.current && containerRef.current) {
      scrollToMiddle(containerRef.current, firstTextUnitToken.ref.current, 1 / 3);
    }
  });

  useEffect(() => {
    if (!tokens) return null;
    setText(renderText(tokens, text_fields));
    if (setReady) setReady((current) => current + 1); // setReady is an optional property used to let parents know the text is ready.
  }, [tokens, text_fields, setReady]);

  if (tokens === null) return null;

  return (
    <div
      key="tokens"
      style={{
        display: "flex",
        alignItems: null,
        height: height,
      }}
    >
      <Ref innerRef={containerRef}>
        <div
          className="TokensContainer"
          style={{
            flex: "1 97%",
            width: "100%",
            overflowY: "auto",
          }}
        >
          {/* <div style={{ height: "10em" }} /> */}
          <div
            style={{
              width: "100%",
              textAlign: "right",
              padding: "10px 30px",
            }}
          >
            <Meta meta_fields={meta_fields} />
          </div>
          <div style={{ padding: "20px" }}>{text["text"]}</div>
          <div style={{ height: "25px" }} />
        </div>
      </Ref>
    </div>
  );
};

const renderText = (tokens, text_fields) => {
  const text = { text: [] }; // yes, it would make sense to just make text an array, but for some reason React doesn't accept it
  if (tokens.length === 0) return text;

  let section = [];
  let paragraph = [];
  let sentence = [];
  let codingUnit = tokens[0].codingUnit;
  let section_name = tokens[0].section;
  let paragraph_nr = tokens[0].paragraph;
  let sentence_nr = tokens[0].sentence;
  let layout = text_fields.find((tf) => tf.name === section_name);

  for (let i = 0; i < tokens.length; i++) {
    tokens[i].arrayIndex = i;
    if (tokens[i].section !== section_name)
      layout = text_fields.find((tf) => tf.name === tokens[i].section);
    const keepParagraphs = layout?.paragraphs;

    if (tokens[i].sentence !== sentence_nr) {
      if (sentence.length > 0) paragraph.push(renderSentence(i, sentence_nr, sentence));
      sentence = [];
    }
    if (keepParagraphs && tokens[i].paragraph !== paragraph_nr) {
      if (paragraph.length > 0) {
        section.push(
          renderParagraph(paragraph_nr, paragraph, tokens[i].paragraph !== paragraph_nr)
        );
      }
      paragraph = [];
    }

    if (tokens[i].section !== section_name) {
      if (section.length > 0)
        text["text"].push(renderSection(layout, i + "_" + section_name, section, section_name));
      section = [];
    }

    paragraph_nr = tokens[i].paragraph;
    sentence_nr = tokens[i].sentence;
    section_name = tokens[i].section;
    codingUnit = tokens[i].codingUnit;

    if (codingUnit) tokens[i].ref = React.createRef();
    sentence.push(renderToken(tokens[i], codingUnit));
  }

  if (sentence.length > 0) paragraph.push(renderSentence("last", sentence_nr, sentence));
  if (paragraph.length > 0) section.push(renderParagraph(paragraph_nr, paragraph, false));
  if (section.length > 0)
    text["text"].push(renderSection(layout, "last_" + section_name, section, section_name));
  return text;
};

const renderSection = (layout, paragraph_nr, paragraphs, section) => {
  const fontstyle = (paragraphs) => {
    if (layout) {
      return (
        <>
          {layout.label ? (
            <span
              style={{
                color: "grey",
                fontWeight: "bold",
                textAlign: "center",
              }}
            >
              {layout.label}
            </span>
          ) : null}
          <p
            className="noselect"
            style={{
              fontSize: `${layout.size != null ? layout.size : 1}em`,
              fontWeight: layout.bold ? "bold" : "normal",
              fontStyle: layout.italic ? "italic" : "normal",
              textAlign: layout.justify ? "justify" : "left",
            }}
            key={section + paragraph_nr}
          >
            {paragraphs}
          </p>
        </>
      );
    }
    return paragraphs;
  };

  return (
    // uses span behaving like p, because p is not allowed due to nested div (for Label)
    <span className="section" key={"section" + section}>
      {fontstyle(paragraphs)}
    </span>
  );
};

const renderParagraph = (paragraph_nr, sentences, end) => {
  return (
    // uses span behaving like p, because p is not allowed due to nested div (for Label)
    <div style={{ display: "flex" }}>
      {/* <div style={{ flex: "1 2%" }}>{paragraphAnnotateButton()}</div> */}
      <span
        key={"par" + paragraph_nr}
        className="paragraph"
        style={{
          flex: "1 98%",
          paddingBottom: end ? "1.5em" : "0em",
          display: "table",
          paddingLeft: "0.3em",
        }}
      >
        {sentences}
      </span>
    </div>
  );
};

const renderSentence = (position, sentence_nr, tokens) => {
  return (
    <span className="sentence" key={"sent" + sentence_nr}>
      {/* {sentenceAnnotateButton()} */}
      {tokens}
    </span>
  );
};

const renderToken = (token, codingUnit) => {
  return (
    <>
      <span
        key={token.index}
        ref={token.ref}
        className={codingUnit ? "token codingUnit" : "token"}
        tokenindex={token.arrayIndex}
      >
        <span className="pre">{token.pre}</span>
        <span className="text">{token.text}</span>
        <span className="post">{token.post}</span>
        <div
          className="variable"
          style={{ position: "absolute", top: "-0.4em", left: "0", fontSize: "0.4em" }}
        ></div>
      </span>
    </>
  );
};

export default React.memo(Tokens);
