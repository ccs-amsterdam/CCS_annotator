import React, { useEffect, useState } from "react";
import { Segment } from "semantic-ui-react";
import Token from "./Token";

import nlp from "compromise";
import paragraphs from "compromise-paragraphs";
nlp.extend(paragraphs);

const Tokens = ({ text, setTokens }) => {
  // It's imporant that the annotations to not pass by this component
  // but are loaded into Token from redux. This prevents rerendering
  // all the parsing stuff
  const [tokenComponents, setTokenComponents] = useState(null);

  useEffect(() => {
    const [paragraphs, tokens] = prepareTokens(text);
    setTokenComponents(paragraphs);
    setTokens(tokens);
  }, [text, setTokens]);

  if (text === null) return null;

  return <Segment style={{ border: "0" }}>{tokenComponents}</Segment>;
};

const prepareTokens = (text) => {
  let tokens = []; // make object with
  const tokenized = nlp.tokenize(text).paragraphs().json({ offset: true });
  const paragraphs = tokenized.map((par, par_i) => {
    return createParagraph(par, par_i, tokens);
  });

  return [paragraphs, tokens];
};

const createParagraph = (par, par_i, tokens) => {
  const mapSentences = (par) => {
    return par.sentences.map((sent) => {
      // for some reason there's an extra array layer between sentences and paragraphs...
      // I've only found cases where lenght is 1, but I'll map it just in case
      return sent.map((sent2) => {
        return createSentence(sent2, tokens);
      });
    });
  };
  return (
    // uses span behaving like p, because p is not allowed due to nested div (for Label)
    <span style={{ marginTop: "1em", display: "table" }} key={par_i}>
      {par_i === 0 ? <h2>{mapSentences(par)}</h2> : mapSentences(par)}
    </span>
  );
};

const createSentence = (sent, tokens) => {
  const mapTokens = (sent) => {
    return sent.terms.map((token) => {
      token.ref = React.createRef();
      tokens.push(token);
      return <Token ref={token.ref} key={token.offset.index} token={token} />;
    });
  };

  return (
    <span className="sentence" key={sent.offset.index}>
      {mapTokens(sent)}
    </span>
  );
};

export default React.memo(Tokens);
