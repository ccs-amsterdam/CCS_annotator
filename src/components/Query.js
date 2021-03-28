import React from "react";
import { Grid } from "semantic-ui-react";

import AmcatIndexSelector from "./CodingjobSelector";
import ArticleTable from "./DocumentTable";
import QueryForm from "./QueryForm";

const Query = () => {
  return (
    <Grid style={{ marginTop: "3em" }}>
      <Grid.Column floated="left" width={5}>
        <AmcatIndexSelector type="table" />
      </Grid.Column>
      <Grid.Column width={10}>
        <Grid.Row>
          <QueryForm />
        </Grid.Row>
        <Grid.Row>
          <ArticleTable />
        </Grid.Row>
      </Grid.Column>
    </Grid>
  );
};

export default Query;
