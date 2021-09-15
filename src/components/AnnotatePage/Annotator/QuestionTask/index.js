import React from "react";
import { Grid } from "semantic-ui-react";
import Tokens from "components/Tokens";
import QuestionForm from "./QuestionForm";
import QuestionTable from "./QuestionTable";

const QuestionTask = ({ taskItem }) => {
  // const mode = useSelector((state) => state.mode);

  // note that tokens is actually an object with doc included: {doc, tokens}
  // passing the states separately caused race issues

  if (taskItem === null) return null;

  return (
    <Grid stackable centered container style={{ height: "100%" }}>
      <Grid.Column width={8}>
        <Grid.Row>
          <Tokens taskItem={taskItem} height={45} textUnitPosition={1 / 2} />
        </Grid.Row>

        <Grid.Row style={{ height: "30vh", marginTop: "1em" }}>
          <QuestionForm taskItem={taskItem} />
        </Grid.Row>
      </Grid.Column>
      <Grid.Column>
        <QuestionTable />
      </Grid.Column>
    </Grid>
  );
};

export default QuestionTask;
