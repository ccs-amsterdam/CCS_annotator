import React from "react";
import { Container } from "semantic-ui-react";
import Token from "./Token";

import nlp from "compromise";
import paragraphs from "compromise-paragraphs";
nlp.extend(paragraphs);

const Tokens = ({ text }) => {
  // It's imporant that the annotations to not pass by this component
  // but are loaded into Token from redux. THis prevents rerendering
  // all the parsing stuff

  const prepareTokens = (text) => {
    const paragraphs = nlp.tokenize(text).paragraphs().json({ offset: true });
    return paragraphs.map((par, par_i) => {
      return createParagraph(par, par_i);
    });
  };

  const createParagraph = (par, par_i) => {
    console.log("PARSING TEXT: THIS SHOULD ONLY HAPPEN ON OPENING ARTICLE");
    const mapSentences = (par) => {
      return par.sentences.map((sent) => {
        // for some reason there's an other array layer...
        // I've only found cases where lenght is 1, but I'll map just in case
        return sent.map((sent2) => {
          return createSentence(sent2);
        });
      });
    };
    return (
      // uses span behaving like p, because p is not allowed due to nested div (for Label)
      <span style={{ marginTop: "1em", display: "inline-block" }} key={par_i}>
        {mapSentences(par)}
      </span>
    );
  };

  const createSentence = (sent) => {
    const mapTokens = (sent) => {
      return sent.terms.map((token) => {
        //tokenList.append([...tokenList, token]);
        return <Token key={token.offset.index} token={token} />;
      });
    };

    return (
      <span className="sentence" key={sent.offset.index}>
        {mapTokens(sent)}
      </span>
    );
  };

  if (text === null) return null;
  return <Container text>{prepareTokens(text)}</Container>;
};

export default React.memo(Tokens);
