import React, { useState } from "react";

import db from "apis/dexie";
import { useHistory } from "react-router-dom";
import { Grid, Button, Header, Segment, Form } from "semantic-ui-react";
import { initStoragePersistence } from "apis/storemanager";
import { demo_articles, demo_codebook } from "apis/demodata";
import { useLiveQuery } from "dexie-react-hooks";

const Welcome = () => {
  const history = useHistory();
  const user = useLiveQuery(() => db.idb.user.get(1));
  const [name, setName] = useState("");

  const loggin = async () => {
    if (name.length < 10) return null;
    try {
      await create_demo_job(db);
      await db.firstLogin(name);
      await initStoragePersistence();
      //alert(history.location.pathname);
      history.goBack();
    } catch (e) {
      console.log(e);
    }
  };

  if (user != null) history.goBack();

  return (
    <Grid inverted textAlign="center" style={{ height: "100vh" }} verticalAlign="middle">
      <Grid.Column style={{ maxWidth: 450 }}>
        <Segment style={{ border: 0 }}>
          <Header as="h2" textAlign="center">
            Welcome to the AmCAT annotator
          </Header>
          <p>
            Before we get started, please provide a username. This name will only be used to get
            some idea of who coded what.
          </p>
          <Form onSubmit={() => loggin()}>
            <Form.Input
              placeholder="username"
              value={name}
              onChange={(e, d) => {
                if (d.value.length < 50) setName(d.value.replace(" ", "_"));
              }}
              autoFocus
              style={{ width: "18em" }}
            />
          </Form>
          {name.length === 49 ? (
            <span style={{ color: "red" }}> Ok ok, please stop typing (really, these people)</span>
          ) : null}
          <br />
          <br />
          <Button primary disabled={name.length < 10} onClick={() => loggin()}>
            {name.length < 10 ? "please use 10 characters or more" : "Get started!"}
          </Button>
        </Segment>
      </Grid.Column>
    </Grid>
  );
};

const create_demo_job = async (db) => {
  try {
    const job = await db.createCodingjob("Demo codingjob");
    await db.createDocuments(job, demo_articles, true);
    await db.writeCodebook(job, demo_codebook);
    return null;
  } catch (e) {
    console.log(e);
  }
};

export default Welcome;
