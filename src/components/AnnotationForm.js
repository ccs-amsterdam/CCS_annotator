import React, { useState } from "react";
import { Grid, Segment } from "semantic-ui-react";

import Tokens from "./Tokens";
import SpanAnnotationEditor from "./spanAnnotationEditor";

const gridStyle = {
  Edit: { overflowY: "auto", height: "75vh" },
  Code: { overflowY: "auto", height: "25vh" },
};

const AnnotationForm = ({ doc, mode }) => {
  const [tokenizedDoc, setTokenizedDoc] = useState(null);
  if (!doc) return null;

  let context = {};
  if (mode === "Code") {
    context = { span: [10, 12], sentence_window: [1, 1], token_window: [50, 50] };
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
      <Grid.Column width={8}>
        <Grid.Row style={gridStyle[mode]}>
          <Tokens doc={doc} context={context} setTokenizedDoc={setTokenizedDoc} />
        </Grid.Row>
        {mode === "Code" ? (
          <Grid.Row style={{ height: "30vh", marginTop: "1em" }}>
            <Segment>Hier coding options</Segment>
          </Grid.Row>
        ) : null}
      </Grid.Column>
      <Grid.Column width={8}>{renderMode(mode)}</Grid.Column>
    </Grid>
  );
};

export default AnnotationForm;
