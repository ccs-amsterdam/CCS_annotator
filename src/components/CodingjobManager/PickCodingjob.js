import React from "react";

import { Grid } from "semantic-ui-react";
import CodingjobSelector from "components/CodingjobManager/CodingjobSelector";

import db from "apis/dexie";

const PickCodingjob = ({ codingjob, setCodingjob }) => {
  return (
    <div style={{ paddingLeft: "1em" }}>
      <Grid stackable columns={2}>
        <Grid.Column stretched width={8} style={{ height: "calc(100vh - 3em)" }}>
          <CodingjobSelector codingjob={codingjob} setCodingjob={setCodingjob} />
        </Grid.Column>
        <Grid.Column width={8}>
          <div style={{ textAlign: "center" }}>TODO: show some details about the job</div>
        </Grid.Column>
      </Grid>
    </div>
  );
};

export default React.memo(PickCodingjob);
