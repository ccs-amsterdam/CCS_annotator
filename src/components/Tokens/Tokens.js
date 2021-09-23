import React, { useEffect, useRef, useState } from "react";
import { Ref, Icon } from "semantic-ui-react";
import { scrollToMiddle } from "util/scroll";
import AnnotatedTextUnit from "./AnnotatedTextUnit";
import Token from "./Token";

const annotationButtonBorderColor = "#3f3fd5";

const Tokens = ({ taskItem, height, textUnitPosition }) => {
  const [tokenComponents, setTokenComponents] = useState({});
  const containerRef = useRef(null);

  useEffect(() => {
    // immitates componentdidupdate to scroll to the textUnit after rendering tokens
    const firstTextUnitToken = taskItem.tokens.find(token => token.textPart === "textUnit");
    if (firstTextUnitToken?.ref?.current && containerRef.current) {
      scrollToMiddle(containerRef.current, firstTextUnitToken.ref.current, textUnitPosition);
    }
  });

  useEffect(() => {
    prepareTokens(taskItem, setTokenComponents);
  }, [taskItem]);

  if (taskItem === null) return null;

  const documentAnnotateButton = () => {
    if (taskItem.itemSettings.taskType === "question") return;
    if (taskItem.itemSettings.textUnit !== "document") return;
    return (
      <AnnotatedTextUnit
        unit="document"
        index={0} // document only has index 0 (but has index for consistency with other units)
        style={{
          float: "left",
          padding: "2em 1em",
          //margin: `${height / 2}vh 0 0 -3em`,  // float document button halfway
          margin: `0 0 0 -3em`,
          borderRadius: "25px 0px 0px 25px",

          border: `2px solid ${annotationButtonBorderColor}`,
        }}
      >
        <Icon
          name="file alternative outline"
          size="large"
          style={{ color: "black", margin: "0" }}
        />
      </AnnotatedTextUnit>
    );
  };

  const contextColor = "grey";
  return (
    <div style={{ display: "flex", maxHeight: `${height}vh` }}>
      <div style={{ flex: "1 3%" }}>{documentAnnotateButton()}</div>

      <Ref innerRef={containerRef}>
        <div
          style={{
            flex: "1 97%",
            width: "100%",
            overflowY: "auto",
          }}
          textAlign="justified"
        >
          <div style={{ color: contextColor, paddingLeft: "0.1em", paddingRight: "0.5em" }}>
            {tokenComponents["contextBefore"]}
          </div>
          <div
            style={{
              borderTop: "2px solid",
              borderBottom: "2px solid",
              background: "#f7f7f78a",
              paddingLeft: "0.1em",
              paddingRight: "0.5em",
              lineHeight: "1.5em",
              fontSize: "1.2em",
            }}
          >
            {tokenComponents["textUnit"]}
          </div>
          <div
            style={{
              color: contextColor,
              paddingLeft: "0.1em",
              paddingRight: "0.5em",
              //paddingBottom: `${0.8 * height * (1 - textUnitPosition)}vh`,
            }}
          >
            {tokenComponents["contextAfter"]}
          </div>
        </div>
      </Ref>
    </div>
  );
};

const prepareTokens = async (taskItem, setTokenComponents) => {
  if (!taskItem.tokens) return null;
  setTokenComponents(renderText(taskItem.tokens, taskItem.item.annotation, taskItem.itemSettings));
  // assignment by reference: renderText also adds a react ref to each token in taskItem.tokens
};

const renderText = (tokens, itemAnnotation, itemSettings) => {
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
      if (sentence.length > 0)
        paragraph.push(
          renderSentence(i, sentence_nr, sentence, itemSettings, tokens[i - 1].textPart)
        );
      sentence = [];
    }
    if (tokens[i].paragraph !== paragraph_nr) {
      if (paragraph.length > 0) {
        section.push(
          renderParagraph(
            i,
            paragraph_nr,
            paragraph,
            paragraph_nr !== currentParagraph,
            tokens[i].paragraph !== paragraph_nr,
            itemSettings,
            tokens[i - 1].textPart
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
      if (sentence.length > 0)
        paragraph.push(
          renderSentence(i, sentence_nr, sentence, itemSettings, tokens[i].textPart - 1)
        );
      if (paragraph.length > 0) {
        section.push(
          renderParagraph(
            i,
            paragraph_nr,
            paragraph,
            paragraph_nr !== currentParagraph,
            tokens[i].paragraph !== paragraph_nr,
            itemSettings,
            tokens[i].textPart
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

  if (sentence.length > 0)
    paragraph.push(
      renderSentence(
        "last",
        sentence_nr,
        sentence,
        itemSettings,
        tokens[tokens.length - 1].textPart
      )
    );
  if (paragraph.length > 0)
    section.push(
      renderParagraph(
        "last",
        paragraph_nr,
        paragraph,
        true,
        false,
        itemSettings,
        tokens[tokens.length - 1].textPart
      )
    );
  if (section.length > 0)
    text[textPart].push(renderSection("last_" + section_name, section, section_name));
  return text;
};

const renderSection = (paragraph_nr, paragraphs, section, itemSettings, textPart) => {
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

const renderParagraph = (position, paragraph_nr, sentences, start, end, itemSettings, textPart) => {
  const paragraphAnnotateButton = () => {
    if (itemSettings.taskType === "question") return;
    if (textPart !== "textUnit") return null;
    if (itemSettings.textUnit !== "document" && itemSettings.textUnit !== "paragraph") return null;
    return (
      <AnnotatedTextUnit
        unit="paragraph"
        index={paragraph_nr}
        style={{
          float: "left",
          height: position === "last" ? "100%" : "calc(100% - 1.8em)",
          margin: "0 0 0 0",
          padding: "0 4px",
          width: "3%",
          border: `2px solid ${annotationButtonBorderColor}`,
          borderRadius: "25px 0px 0px 25px",

          borderRight: "1px dashed black",
        }}
      ></AnnotatedTextUnit>
    );
  };
  return (
    // uses span behaving like p, because p is not allowed due to nested div (for Label)
    <div style={{ display: "flex" }}>
      <div style={{ flex: "1 2%" }}>{paragraphAnnotateButton()}</div>
      <span
        className="paragraph"
        style={{
          flex: "1 98%",
          paddingBottom: end ? "1.5em" : "0em",
          display: "table",
          paddingLeft: "0.3em",
        }}
        key={position + "_" + paragraph_nr}
      >
        {sentences}
      </span>
    </div>
  );
};

const renderSentence = (position, sentence_nr, tokens, itemSettings, textPart) => {
  const sentenceAnnotateButton = () => {
    if (itemSettings.taskType === "question") return;
    if (textPart !== "textUnit") return null;
    return (
      <AnnotatedTextUnit
        unit="sentence"
        index={sentence_nr}
        style={{
          padding: "0 4px 0 4px",
          margin: "0em 0.2em 0em 0.1em",
          border: `2px solid ${annotationButtonBorderColor}`,
          borderRight: "1px dashed black",
          borderRadius: "10px 0px 0px 10px",
        }}
      />
    );
  };

  return (
    <span className="sentence" key={sentence_nr}>
      {sentenceAnnotateButton()}
      {tokens}
    </span>
  );
};

const renderToken = (token, annotation) => {
  return <Token ref={token.ref} key={token.index} token={token} annotation={annotation} />;
};

export default React.memo(Tokens);
