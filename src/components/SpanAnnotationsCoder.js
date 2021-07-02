import React from "react";
import { Container, Grid, Header, Segment } from "semantic-ui-react";
import Tokens from "./Tokens";

const gridStyleTop = { height: "35vh" };
const gridStyleBottom = { overflowY: "auto", height: "45vh" };

const SpanAnnotationsCoder = ({ doc, item, contextUnit }) => {
  // note that tokens is actually an object with doc included: {doc, tokens}
  // passing the states separately caused race issues

  if (doc === null) return null;

  // add controll mode here for next annotation
  // get setdoc callback from annotate.js
  // give option to let next document be random or not
  // give option to let next annotation in article be random or not
  // give option for max annotations per article

  return (
    <Grid container stackable columns={2}>
      <Grid.Column width={8} style={{ paddingRight: "0em" }}>
        <Grid.Row>
          <Tokens
            doc={doc}
            item={item}
            contextUnit={contextUnit}
            height={45}
            codingUnitPosition={1 / 3}
          />
        </Grid.Row>

        <Grid.Row style={{ height: "30vh", marginTop: "1em" }}>
          <Segment>Hier coding options</Segment>
        </Grid.Row>
      </Grid.Column>
      <Grid.Column width={8}>
        <Grid.Row style={gridStyleTop}></Grid.Row>
        <Grid.Row style={gridStyleBottom}>
          <SpanInstructions />
        </Grid.Row>
      </Grid.Column>
    </Grid>
  );
};

const SpanInstructions = () => {
  return (
    <Container>
      <Header as="h2" align="center">
        Code annotations
      </Header>
    </Container>
  );
};

export default SpanAnnotationsCoder;
