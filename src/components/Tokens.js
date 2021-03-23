import React from "react";
import { Container } from "semantic-ui-react";
import { useDispatch } from "react-redux";
import { toggleAnnotations } from "../Actions";
import Token from "./Token";

import nlp from "compromise";
import paragraphs from "compromise-paragraphs";
nlp.extend(paragraphs);

// const getTokenizedLength = (tokenized) => {
//   return tokenized
//     .slice(-1)[0]
//     .sentences.slice(-1)[0]
//     .slice(-1)[0]
//     .terms.slice(-1)[0].offset.index;
// };

const Tokens = ({ text, importSpanAnnotations = [] }) => {
  // It's imporant that the annotations to not pass by this component
  // but are loaded into Token from redux. THis prevents rerendering
  // all the parsing stuff
  const dispatch = useDispatch();
  let tokenIndices = Array(text.length).fill(null);

  const prepareTokens = (text) => {
    const tokenized = nlp.tokenize(text).paragraphs().json({ offset: true });
    const paragraphs = tokenized.map((par, par_i) => {
      return createParagraph(par, par_i);
    });
    if (importSpanAnnotations.length > 0)
      loadAnnotations(importSpanAnnotations, tokenIndices);
    return paragraphs;
  };

  const createParagraph = (par, par_i) => {
    const mapSentences = (par) => {
      return par.sentences.map((sent) => {
        // for some reason there's an other array layer...
        // I've only found cases where lenght is 1, but I'll map just in case
        return sent.map((sent2) => {
          return createSentence(sent2, par_i);
        });
      });
    };
    return (
      // uses span behaving like p, because p is not allowed due to nested div (for Label)
      <span style={{ marginTop: "1em", display: "inline-block" }} key={par_i}>
        {par_i === 0 ? <h2>{mapSentences(par)}</h2> : mapSentences(par)}
      </span>
    );
  };

  const createSentence = (sent) => {
    const mapTokens = (sent) => {
      return sent.terms.map((token) => {
        for (let i = 0; i < token.offset.length; i++) {
          tokenIndices[token.offset.start + i] = token.offset.index;
        }
        return <Token key={token.offset.index} token={token} />;
      });
    };

    return (
      <span className="sentence" key={sent.offset.index}>
        {mapTokens(sent)}
      </span>
    );
  };

  const loadAnnotations = (importSpanAnnotations, tokenIndices) => {
    const tokenAnnotationArrays = importSpanAnnotations.map(
      (spanAnnotation) => {
        let tokenAnnotations = [];
        const from_token = tokenIndices[spanAnnotation.offset];
        const to_token =
          tokenIndices[spanAnnotation.offset + spanAnnotation.length];
        for (let i = from_token; i <= to_token; i++) {
          tokenAnnotations.push({
            index: i,
            group: spanAnnotation.group,
            offset: spanAnnotation.offset,
            length: spanAnnotation.length,
            span: [from_token, to_token],
          });
        }
        return tokenAnnotations;
      }
    );
    const tokenAnnotations = [].concat.apply([], tokenAnnotationArrays);
    dispatch(toggleAnnotations(tokenAnnotations));
  };

  if (text === null) return null;
  return <Container text>{prepareTokens(text)}</Container>;
};

export default React.memo(Tokens);
