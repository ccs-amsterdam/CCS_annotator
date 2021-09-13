import React from "react";
import { Grid } from "semantic-ui-react";
import Tokens from "./Tokens";
import QuestionForm from "./QuestionForm";

const SpanAnnotationsCoder = ({ doc }) => {
  // const mode = useSelector((state) => state.mode);

  // note that tokens is actually an object with doc included: {doc, tokens}
  // passing the states separately caused race issues

  if (doc === null) return null;

  return (
    <Grid stackable centered container style={{ height: "100%" }}>
      <Grid.Column width={8}>
        <Grid.Row>
          <Tokens doc={doc} height={45} textUnitPosition={1 / 2} />
        </Grid.Row>

        <Grid.Row style={{ height: "30vh", marginTop: "1em" }}>
          <QuestionForm doc={doc} />
        </Grid.Row>
      </Grid.Column>
    </Grid>
  );
};

export default SpanAnnotationsCoder;
