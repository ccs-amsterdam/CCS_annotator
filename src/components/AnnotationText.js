import React, { useState } from "react";
import { Grid } from "semantic-ui-react";

import Tokens from "./Tokens";
import SpanAnnotations from "./spanAnnotations";

const gridStyle = { overflowY: "auto", height: "75vh" };

const AnnotationText = ({ doc }) => {
  const [tokenizedDoc, setTokenizedDoc] = useState(null);
  if (!doc) return null;

  // <Tokens> both renders the tokens and copies to the doc to a new state
  // that also contains references to the tokens
  return (
    <Grid container columns={2}>
      <Grid.Column width={8} style={gridStyle}>
        <Tokens doc={doc} setTokenizedDoc={setTokenizedDoc} />
      </Grid.Column>
      <Grid.Column width={8}>
        <SpanAnnotations doc={tokenizedDoc} />
      </Grid.Column>
    </Grid>
  );
};

export default AnnotationText;
