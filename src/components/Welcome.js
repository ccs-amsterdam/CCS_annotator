import React from "react";
import { useDispatch } from "react-redux";
import { setDB } from "../actions";
import Dexie from "dexie";

import AnnotationDB from "../apis/dexie";
import { useHistory } from "react-router-dom";
import { Grid, Button, Header, Segment } from "semantic-ui-react";
import { initStoragePersistence } from "../apis/storemanager";

const Welcome = ({ items }) => {
  const dispatch = useDispatch();
  const history = useHistory();

  const loggin = async () => {
    try {
      console.log("teeeeeeeeeeeeeeeeeest");
      const db = await new AnnotationDB();
      dispatch(setDB(db));
      await initStoragePersistence();
      history.push(items[0].path);
    } catch (e) {}
  };

  Dexie.exists("AmCAT_Annotator").then((exists) => {
    if (exists) loggin();
  });

  return (
    <Grid
      inverted
      textAlign="center"
      style={{ height: "100vh" }}
      verticalAlign="middle"
    >
      <Grid.Column style={{ maxWidth: 450 }}>
        <Segment style={{ border: 0 }}>
          <Header as="h2" textAlign="center">
            Welcome to the AmCAT annotator
          </Header>
          <p>
            This is the (early development version of the) AmCAT annotator. The
            fact that you see this message means that you're either here for the
            first time, or your local annotation database was reset (by you or
            your browser).
          </p>
          <p>
            The annotator stores your codingjobs and annotations on your local
            computer in your browser's IndexedDB. Your data will only actually
            touch the internet when you synchronize your data. Currently we've
            implemented syncronization with Dropbox. This way we have nothing to
            do with your data.
          </p>
          <Button primary onClick={loggin}>
            Yes, off course I trust you
          </Button>
        </Segment>
      </Grid.Column>
    </Grid>
  );
};

export default Welcome;
