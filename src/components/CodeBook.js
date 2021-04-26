import React, { useEffect, useState } from "react";
import { Grid, Header, List } from "semantic-ui-react";
import { useSelector } from "react-redux";

const CodeBook = () => {
  const codingjob = useSelector((state) => state.codingjob);
  const [codebook, setCodebook] = useState([]);

  useEffect(() => {
    if (!codingjob) return null;
    if (!codingjob.codebook) return null;
    const cb = JSON.parse(codingjob.codebook);
    console.log(cb);
    if (cb) setCodebook(cb);
  }, [codingjob]);

  if (!codingjob) return null;

  return (
    <Grid stackable style={{ marginTop: "1.0em" }}>
      <Grid.Column width={6}>
        <Header as="h4">Code</Header>
        <List>{listCodes(codebook)}</List>
      </Grid.Column>
    </Grid>
  );
};

const listCodes = (codebook) => {
  console.log(codebook);
  return codebook.map((code) => {
    return <List.Item>{code.code}</List.Item>;
  });
};

export default CodeBook;
