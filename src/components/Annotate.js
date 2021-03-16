import React from "react";
import { useSelector } from "react-redux";
import { Dropdown, Grid } from "semantic-ui-react";

const Annotate = () => {
  const indices = useSelector((state) => state.indices);
  const articles = useSelector((state) => state.articles);

  return (
    <Grid>
      <Grid.Column width={4}>
        <Dropdown text="show per page" />
      </Grid.Column>
    </Grid>
  );
};

export default Annotate;
