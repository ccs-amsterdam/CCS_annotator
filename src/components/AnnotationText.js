import React, { useState } from "react";
import { Grid } from "semantic-ui-react";

import Tokens from "./Tokens";
import SpanAnnotations from "./spanAnnotations";

const gridStyle = { overflowY: "auto", height: "75vh" };

const AnnotationText = ({ doc }) => {
  const [tokens, setTokens] = useState([]);

  if (!doc) return null;
  return (
    <Grid container columns={2}>
      <Grid.Column width={8} style={gridStyle}>
        <Tokens doc={doc} setTokens={setTokens} />
      </Grid.Column>
      <Grid.Column width={8}>
        <SpanAnnotations doc={doc} tokens={tokens} />
      </Grid.Column>
    </Grid>
  );
};

export default AnnotationText;

// title is optional. If empty, just show text nr in breadcrumb
// annotations can be document, paragraph, sentence or token level
// these are stored in separate keys in the annotations
// For paragraph, sentence and token level, the specific texts are also exported with the annotations
