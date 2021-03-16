import React from "react";
import { Grid } from "semantic-ui-react";

import AmcatIndexSelector from "./AmcatIndexSelector";
import CreateDocument from "./CreateDocument";

const Create = () => {
  return (
    <Grid style={{ marginTop: "3em" }}>
      <Grid.Column floated="left" width={5}>
        <AmcatIndexSelector type="table" />
      </Grid.Column>
      <Grid.Column width={10}>
        <CreateDocument />
      </Grid.Column>
    </Grid>
  );
};

export default Create;
