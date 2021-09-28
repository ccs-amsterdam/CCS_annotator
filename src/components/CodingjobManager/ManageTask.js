import db from "apis/dexie";

import React, { useEffect, useState } from "react";
import TaskSettings from "./ItemSettings/TaskSettings";
import { Grid, Header } from "semantic-ui-react";

const ManageTask = ({ codingjob }) => {
  // When a new codingjob is loaded, set codingjobLoaded ref to false
  // this prevents actually loading the data until unitSettings has loaded
  // the unitSettings stored in the codingjob
  const [questionIndex, setQuestionIndex] = useState(0);

  if (!codingjob) return null;

  return (
    <div>
      <Grid stackable columns={5}>
        <Grid.Column verticalAlign="top" stretched width={8}>
          <Header textAlign="center">Settings</Header>
          <TaskSettings
            codingjob={codingjob}
            questionIndex={questionIndex}
            setQuestionIndex={setQuestionIndex}
          />
        </Grid.Column>
      </Grid>
    </div>
  );
};

export default React.memo(ManageTask);
