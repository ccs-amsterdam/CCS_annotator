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
  const relativeWindowSplit = 50;
  const windowheight = 80;
  const windowSplit = relativeWindowSplit * (windowheight / 100);

  return (
    <Grid stackable centered container>
      <Grid.Column width={8}>
        <Grid.Row>
          <Tokens taskItem={taskItem} height={windowSplit} textUnitPosition={1 / 2} />
        </Grid.Row>

        <Grid.Row style={{ marginTop: "1em", height: `${windowheight - windowSplit}vh` }}>
          <QuestionForm taskItem={taskItem} />
        </Grid.Row>
      </Grid.Column>
      <Grid.Column>
        <QuestionTable taskItem={taskItem} />
      </Grid.Column>
    </Grid>
  );
};

export default QuestionTask;
