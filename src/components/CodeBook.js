import React, { useState } from "react";
import { Grid, Header, TextArea, Form, List } from "semantic-ui-react";
import randomColor from "randomcolor";

const CodeBook = () => {
  const [codebook, setCodebook] = useState("");

  return (
    <Grid stackable style={{ marginTop: "1.0em" }}>
      <Grid.Column width={10}>
        <Header as="h4">Code editor</Header>
        <Form>
          <TextArea
            placeholder="Enter Codes"
            value={codebook}
            style={{ borderColor: "lightgrey" }}
            rows={30}
            onChange={(e, d) => setCodebook(d.value)}
          />
        </Form>
      </Grid.Column>
      <Grid.Column width={6}>
        <Header as="h4">Code</Header>
        <List>{listCodes(codebook)}</List>
      </Grid.Column>
    </Grid>
  );
};

const listCodes = (codebook) => {
  return codebook.split("\n").map((code) => {
    return <List.Item>{code}</List.Item>;
  });
};

//         color: randomColor({ seed: d.value, luminosity: "bright" }),

export default CodeBook;
