import React from "react";
import { Grid, Header } from "semantic-ui-react";
import { useSelector } from "react-redux";

import CodeTreeTable from "./CodeTreeTable";

const CodeBook = () => {
  const codingjob = useSelector((state) => state.codingjob);

  if (!codingjob) return null;

  return (
    <Grid>
      <Grid.Column width={8}></Grid.Column>
      <Grid.Column width={8} style={{ display: "block", overflow: "auto", height: "90vh" }}>
        <Header as="h4" textAlign="center">
          Codes
        </Header>

        <CodeTreeTable />
      </Grid.Column>
    </Grid>
  );
};

export default CodeBook;
