import React, { useEffect } from "react";

import db from "../apis/dexie";
import { useHistory } from "react-router-dom";
import { Grid, Button, Header, Segment } from "semantic-ui-react";
import { initStoragePersistence } from "../apis/storemanager";
import { demo_articles, demo_codebook } from "../apis/demodata";

const Welcome = ({ items }) => {
  const history = useHistory();

  const loggin = async (addDemo, checkWelcome) => {
    if (checkWelcome) {
      const iswelcome = await db.isWelcome();
      if (!iswelcome) {
        return null;
      }
    }
    try {
      if (addDemo) await create_demo_job(db);
      await db.welcome();
      await initStoragePersistence();
      history.push(items[0].path);
    } catch (e) {}
  };

  useEffect(() => {
    loggin(false, true);
  });

  return (
    <Grid inverted textAlign="center" style={{ height: "100vh" }} verticalAlign="middle">
      <Grid.Column style={{ maxWidth: 450 }}>
        <Segment style={{ border: 0 }}>
          <Header as="h2" textAlign="center">
            Welcome to the AmCAT annotator
          </Header>
          <p>
            This is the (early development version of the) AmCAT annotator. The fact that you see
            this message means that you're either here for the first time, or your local annotation
            database was reset (by you or your browser).
          </p>
          <p>
            The annotator stores your codingjobs and annotations on your local computer in your
            browser's IndexedDB. Your data will only actually touch the internet when you
            synchronize your data.
          </p>
          <Button primary onClick={() => loggin(true, false)}>
            Yes, off course I trust you
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
