import React from "react";
import { useSelector } from "react-redux";
import { Container, Grid, Header, Segment } from "semantic-ui-react";
import Tokens from "./Tokens";

const gridStyleTop = { height: "35vh" };
const gridStyleBottom = { overflowY: "auto", height: "45vh" };

const SpanAnnotationsCoder = ({ doc }) => {
  const mode = useSelector((state) => state.mode);
  // note that tokens is actually an object with doc included: {doc, tokens}
  // passing the states separately caused race issues

  if (doc === null) return null;

  // add controll mode here for next annotation
  // get setdoc callback from annotate.js
  // give option to let next document be random or not
  // give option to let next annotation in article be random or not
  // give option for max annotations per article

  return (
    <Grid stackable centered container style={{ height: "100%" }}>
      <Grid.Column width={mode === "design" ? 8 : 16}>
        <Grid.Row>
          <Tokens doc={doc} height={45} textUnitPosition={1 / 2} />
        </Grid.Row>

        <Grid.Row style={{ height: "30vh", marginTop: "1em" }}>
          <Segment style={{ height: "100%" }}>Hier coding options</Segment>
        </Grid.Row>
      </Grid.Column>
      {mode === "design" ? (
        <Grid.Column width={8}>
          <Grid.Row style={gridStyleTop}></Grid.Row>
          <Grid.Row style={gridStyleBottom}>
            <SpanInstructions />
          </Grid.Row>
        </Grid.Column>
      ) : null}
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
