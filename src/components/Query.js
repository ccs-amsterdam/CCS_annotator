import React from "react";
import { Grid } from "semantic-ui-react";

import SelectIndex from "./SelectIndex";
import QueryForm from "./QueryForm";

const Query = () => {
  return (
    <Grid style={{ marginTop: "3em" }}>
      <Grid.Column floated="left" width={5}>
        <SelectIndex />
      </Grid.Column>
      <Grid.Column width={10}>
        {/* <ManageIndex session={session} index={index} /> */}
        {/* <CreateDocument /> */}
        <QueryForm />
      </Grid.Column>
    </Grid>
  );
};

export default Query;
