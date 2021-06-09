import React, { useState } from "react";
import { Grid } from "semantic-ui-react";

import Tokens from "./Tokens";
import SpanAnnotationEditor from "./spanAnnotationEditor";

const gridStyle = { overflowY: "auto", height: "75vh" };

const AnnotationForm = ({ doc, mode }) => {
  const [tokenizedDoc, setTokenizedDoc] = useState(null);
  if (!doc) return null;

  let contextUnit = null;
  if (mode === "Code") {
    contextUnit = { sentence_window: [1, 1], word_window: [20, 20] };
  }

  const renderMode = (mode) => {
    switch (mode) {
      case "Edit":
        return <SpanAnnotationEditor doc={tokenizedDoc} />;
      default:
        return null;
    }
  };

  // <Tokens> both renders the tokens and copies to the doc to a new state
  // that also contains references to the tokens
  return (
    <Grid container stackable columns={2}>
      <Grid.Column width={8} style={gridStyle}>
        <Tokens doc={doc} contextUnit={contextUnit} setTokenizedDoc={setTokenizedDoc} />
      </Grid.Column>
      <Grid.Column width={8}>{renderMode(mode)}</Grid.Column>
    </Grid>
  );
};

export default AnnotationForm;
