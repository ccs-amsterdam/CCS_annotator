import React, { useState } from "react";
import { Grid } from "semantic-ui-react";

import SpanAnnotations from "./SpanAnnotations";
import SpanAnnotationsDB from "./SpanAnnotationsDB";

import Tokens from "./Tokens";

const AnnotationText = ({ doc }) => {
  const [tokens, setTokens] = useState([]);

  if (!doc) return null;
  return (
    <>
      <Grid.Row>
        <Grid.Column width={10}>
          <Tokens text={doc.text} setTokens={setTokens} />
        </Grid.Column>
        <Grid.Column width={6}></Grid.Column>
      </Grid.Row>

      <SpanAnnotations doc={doc} tokens={tokens} />
      <SpanAnnotationsDB doc={doc} tokens={tokens} />
    </>
  );
};

export default AnnotationText;

// title is optional. If empty, just show text nr in breadcrumb
// annotations can be document, paragraph, sentence or token level
// these are stored in separate keys in the annotations
// For paragraph, sentence and token level, the specific texts are also exported with the annotations
