import React, { useEffect, useRef, useState } from "react";
import { Ref } from "semantic-ui-react";
import { scrollToMiddle } from "util/scroll";
import Token from "./Token";

const Tokens = ({ itemBundle }) => {
  const [text, setText] = useState({});
  const containerRef = useRef(null);

  useEffect(() => {
    // immitates componentdidupdate to scroll to the textUnit after rendering tokens
    const firstTextUnitToken = itemBundle.tokens.find((token) => token.textPart === "textUnit");
    if (firstTextUnitToken?.ref?.current && containerRef.current) {
      scrollToMiddle(
        containerRef.current,
        firstTextUnitToken.ref.current,
        itemBundle.settings.textUnitPosition
      );
    }
  });

  useEffect(() => {
    prepareTokens(itemBundle, setText);
  }, [itemBundle]);

  if (itemBundle === null) return null;

  // const documentAnnotateButton = () => {
  //   if (itemBundle.codebook.taskType === "question") return;
  //   if (itemBundle.codebook.textUnit !== "document") return;
  //   return (
  //     <AnnotatedTextUnit
  //       unit="document"npm
  //       index={0} // document only has index 0 (but has index for consistency with other units)
  //       style={{
  //         float: "left",
  //         padding: "2em 1em",
  //         //margin: `${settings.height / 2}vh 0 0 -3em`,  // float document button halfway
  //         margin: `0 0 0 -3em`,
  //         borderRadius: "25px 0px 0px 25px",

  //         border: `2px solid ${annotationButtonBorderColor}`,
  //       }}
  //     >
  //       <Icon
  //         name="file alternative outline"
  //         size="large"
  //         style={{ color: "black", margin: "0" }}
  //       />
  //     </AnnotatedTextUnit>
  //   );
  // };

  return (
    <div style={{ display: "flex", height: `${itemBundle.settings.height}vh` }}>
      {/* <div style={{ flex: "1 3%" }}>{documentAnnotateButton()}</div> */}

      <Ref innerRef={containerRef}>
        <div
          style={{
            flex: "1 97%",
            width: "100%",
            overflowY: "auto",
          }}
          textAlign="justified"
          verticalAlign="center"
        >
          <div>{text["text"]}</div>
        </div>
      </Ref>
    </div>
  );
};

const prepareTokens = async (itemBundle, setText) => {
  if (!itemBundle.tokens) return null;
  setText(renderText(itemBundle));
  // !! assignment by reference: renderText also adds a react ref to each token in itemBundle.tokens
};

const renderText = (itemBundle) => {
  const text = { text: [] }; // yes, it would make sense to just make text an array, but for some reason React doesn't accept it
  const tokens = itemBundle.tokens;
  console.log(tokens);

  let section = [];
  let paragraph = [];
  let sentence = [];
  let textPart = tokens[0].textPart;
  let section_name = tokens[0].section;
  let paragraph_nr = tokens[0].paragraph;
  let sentence_nr = tokens[0].sentence;
  let currentParagraph = paragraph_nr;

  for (let i = 0; i < tokens.length; i++) {
    tokens[i].arrayIndex = i;

    if (tokens[i].sentence !== sentence_nr) {
      if (sentence.length > 0)
        paragraph.push(renderSentence(i, sentence_nr, sentence, itemBundle, textPart));
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
            itemBundle,
            textPart
          )
        );
        currentParagraph = tokens[i].paragraph;
      }
      paragraph = [];
    }

    if (tokens[i].section !== section_name) {
      if (section.length > 0)
        text["text"].push(renderSection(i + "_" + section_name, section, section_name));
      section = [];
    }

    paragraph_nr = tokens[i].paragraph;
    sentence_nr = tokens[i].sentence;
    section_name = tokens[i].section;
    textPart = tokens[i].textPart;

    if (textPart === "textUnit") tokens[i].ref = React.createRef();
    sentence.push(renderToken(tokens[i], itemBundle, textPart));
  }

  if (sentence.length > 0)
    paragraph.push(renderSentence("last", sentence_nr, sentence, itemBundle, textPart));
  if (paragraph.length > 0)
    section.push(
      renderParagraph("last", paragraph_nr, paragraph, true, false, itemBundle, textPart)
    );
  if (section.length > 0)
    text["text"].push(renderSection("last_" + section_name, section, section_name));
  return text;
};

const renderSection = (paragraph_nr, paragraphs, section) => {
  const fontstyle = (paragraphs) => {
    if (section === "title") return <h2 key={paragraph_nr}>{paragraphs}</h2>;
    return paragraphs;
  };

  return (
    // uses span behaving like p, because p is not allowed due to nested div (for Label)
    <span className="section" key={paragraph_nr}>
      {fontstyle(paragraphs)}
    </span>
  );
};

const renderParagraph = (position, paragraph_nr, sentences, start, end, itemBundle, textPart) => {
  // const paragraphAnnotateButton = () => {
  //   if (itemBundle.codebook.taskType === "question") return;
  //   if (textPart !== "textUnit") return null;
  //   if (itemBundle.codebook.textUnit !== "document" && itemBundle.codebook.textUnit !== "paragraph") return null;
  //   return (
  //     <AnnotatedTextUnit
  //       unit="paragraph"
  //       index={paragraph_nr}
  //       style={{
  //         float: "left",
  //         height: position === "last" ? "100%" : "calc(100% - 1.8em)",
  //         margin: "0 0 0 0",
  //         padding: "0 4px",
  //         width: "3%",
  //         border: `2px solid ${annotationButtonBorderColor}`,
  //         borderRadius: "25px 0px 0px 25px",

  //         borderRight: "1px dashed black",
  //       }}
  //     ></AnnotatedTextUnit>
  //   );
  // };
  return (
    // uses span behaving like p, because p is not allowed due to nested div (for Label)
    <div style={{ display: "flex" }}>
      {/* <div style={{ flex: "1 2%" }}>{paragraphAnnotateButton()}</div> */}
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

const renderSentence = (position, sentence_nr, tokens, itemBundle, textPart) => {
  // const sentenceAnnotateButton = () => {
  //   if (itemBundle.codebook.taskType === "question") return;
  //   if (textPart !== "textUnit") return null;
  //   return (
  //     <AnnotatedTextUnit
  //       unit="sentence"
  //       index={sentence_nr}
  //       style={{
  //         padding: "0 4px 0 4px",
  //         margin: "0em 0.2em 0em 0.1em",
  //         border: `2px solid ${annotationButtonBorderColor}`,
  //         borderRight: "1px dashed black",
  //         borderRadius: "10px 0px 0px 10px",
  //       }}
  //     />
  //   );
  // };

  return (
    <span className="sentence" key={sentence_nr}>
      {/* {sentenceAnnotateButton()} */}
      {tokens}
    </span>
  );
};

const renderToken = (token, itemBundle, textPart) => {
  if (textPart === "textUnit")
    return (
      <span
        style={{
          lineHeight: "1.5em",
          fontSize: "1.2em",
        }}
      >
        <Token ref={token.ref} key={token.index} token={token} itemBundle={itemBundle} />
      </span>
    );
  return (
    <span style={{ color: "lightblue" }}>
      <Token ref={token.ref} key={token.index} token={token} itemBundle={itemBundle} />
    </span>
  );
};

export default React.memo(Tokens);
