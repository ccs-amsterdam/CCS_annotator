import React from "react";
import { Grid } from "semantic-ui-react";

import SelectIndex from "./SelectIndex";
import CreateDocument from "./CreateDocument";

const Create = () => {
  return (
    <Grid style={{ marginTop: "3em" }}>
      <Grid.Column floated="left" width={5}>
        <SelectIndex />
      </Grid.Column>
      <Grid.Column width={10}>
        <CreateDocument />
      </Grid.Column>
    </Grid>
  );
};

export default Create;
