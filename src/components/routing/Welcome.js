import React, { useState, useEffect } from "react";

import db from "apis/dexie";
import { useHistory } from "react-router-dom";
import { Grid, Button, Header, Segment, Form } from "semantic-ui-react";
import { demo_articles, demo_codebook } from "apis/demodata";
import { useLiveQuery } from "dexie-react-hooks";

const homepage = "/amcat4annotator";

const Welcome = ({ redirectUrl }) => {
  const history = useHistory();
  const user = useLiveQuery(() => db.idb.user.get(1));
  const [name, setName] = useState("");

  useEffect(() => {
    if (user != null) {
      if (redirectUrl) {
        history.push(redirectUrl);
      } else history.push(homepage + "/manager");
    }
  }, [user, history, redirectUrl]);

  const loggin = async () => {
    if (name.length < 5) return null;
    try {
      await create_demo_job(db);
      await db.firstLogin(name);
      //await initStoragePersistence();
      //alert(history.location.pathname);
      // should actually go back to previous page if previous page was annotator, but
      // not clue how to see this in history
      if (redirectUrl) {
        history.push(redirectUrl);
      } else history.push(homepage + "/manager");
    } catch (e) {
      console.log(e);
    }
  };

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
          <Button primary disabled={name.length < 5} onClick={() => loggin()}>
            {name.length < 5 ? "please use 5 characters or more" : "Get started!"}
          </Button>
        </Segment>
      </Grid.Column>
    </Grid>
  );
};

const create_demo_job = async db => {
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
