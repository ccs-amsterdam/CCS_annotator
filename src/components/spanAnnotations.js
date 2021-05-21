import React from "react";
import { Container, Grid } from "semantic-ui-react";
import SpanAnnotationsDB from "./SpanAnnotationsDB";
import SpanAnnotationsNavigation from "./SpanAnnotationsNavigation";
import SpanAnnotationsMenu from "./SpanAnnotationsMenu";

const gridStyleTop = { height: "35vh" };
const gridStyleBottom = { overflowY: "auto", height: "45vh" };

const SpanAnnotations = ({ doc, tokens }) => {
  return (
    <>
      <Grid.Row style={gridStyleTop}>
        <SpanAnnotationsMenu doc={doc} tokens={tokens} />
      </Grid.Row>
      <Grid.Row style={gridStyleBottom}></Grid.Row>
      <SpanAnnotationsNavigation doc={doc} tokens={tokens} />
      <SpanAnnotationsDB doc={doc} tokens={tokens} />
    </>
  );
};

export default SpanAnnotations;
