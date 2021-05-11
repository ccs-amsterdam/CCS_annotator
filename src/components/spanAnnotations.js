import React from "react";
import { Grid, Segment } from "semantic-ui-react";
import SpanAnnotationsDB from "./SpanAnnotationsDB";
import SpanAnnotationsNavigation from "./SpanAnnotationsNavigation";
import SpanAnnotationsMenu from "./SpanAnnotationsMenu";

const gridStyleTop = { height: "30vh" };
const gridStyleBottom = { overflowY: "auto", height: "50vh" };

const SpanAnnotations = ({ doc, tokens }) => {
  return (
    <>
      <Grid.Row style={gridStyleTop}>
        <SpanAnnotationsMenu doc={doc} tokens={tokens} />
      </Grid.Row>
      <Grid.Row style={gridStyleBottom}>
        <Segment style={{ marginTop: "1em", border: "0" }}>test</Segment>
      </Grid.Row>
      <SpanAnnotationsNavigation doc={doc} tokens={tokens} />
      <SpanAnnotationsDB doc={doc} tokens={tokens} />
    </>
  );
};

export default SpanAnnotations;
