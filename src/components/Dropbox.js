import React, { useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { setDropbox } from "../actions";
import { useHistory } from "react-router-dom";
import { Menu, Modal, Header, Button } from "semantic-ui-react";

import {
  getDropboxAuth,
  getCodeFromDropbox,
  makeConnection,
  getCodeFromUrl,
  getAuthToken,
} from "../apis/dropbox";
import DropboxSync from "./DropboxSync";

// PKCE browser authentication for Dropbox:
// https://github.com/dropbox/dropbox-sdk-js

const clientID = "doge8b5gywmaz6x";
const host = "http://localhost:3000";
const route = "/create";
const redirectURL = host + route;

let dbxAuth = getDropboxAuth(clientID); // this is an ID that doesn't have to be secret
const DropboxConnect = () => {
  const [open, setOpen] = useState();
  const dropbox = useSelector((state) => state.dropbox);
  const db = useSelector((state) => state.db);
  const [tryRestore, setTryRestore] = useState(true);
  const dispatch = useDispatch();
  const history = useHistory();

  // Change this if you're deploying this app on another host
  // You'll need to create your own Dropbox app, where you specify
  // allowed redirect urls for the new host

  useEffect(() => {
    console.log("listen");
    if (dropbox || !db) return;

    const connect = async (token) => {
      try {
        const connection = await makeConnection(dbxAuth, token.token);
        await db.addToken("dropbox", token);
        await dispatch(setDropbox(connection));
      } catch (e) {
        console.log(e);
      }
    };

    if (tryRestore) {
      setTryRestore(false); // try once to get token from db (once db is loaded)
      // check for token in db to restore connection
      db.getToken("dropbox").then((token) => {
        if (!token) return;
        if (!token.token) return;

        if (Date.now() > token.expiration_date) {
          //not yet tested
          console.log("Trying refresh");
          dbxAuth.setRefreshToken(token.refresh_token);
          dbxAuth.refreshAccessToken().then(connect);
        } else {
          connect(token);
        }
      });
    }

    // check for code in url from dropbox redirect
    const code = getCodeFromUrl();
    if (code)
      getAuthToken(dbxAuth, code, redirectURL)
        .then(connect)
        .then(() => {
          history.push(route); // remove code from url
        })
        .catch((e) => console.log(e));
  }, [dropbox, db, tryRestore, dispatch, history]);

  const startAuthentication = () => {
    // redirects from dropbox with code in url
    getCodeFromDropbox(dbxAuth, redirectURL);
  };

  if (!db) return null;

  if (dropbox) {
    return <DropboxSync />;
  }

  return (
    <Modal
      closeIcon
      open={open}
      trigger={<Menu.Item icon="dropbox" name="Connect" />}
      onClose={() => setOpen(false)}
      onOpen={() => setOpen(true)}
    >
      <Header icon="dropbox" content="Connect to Dropbox" />
      <Modal.Content>
        <p>
          This app connects with Dropbox using OAuth 2.0 authorization with PKCE
          flow. Your will exchange your data directly with Dropbox, so we can't
          touch it. (So we also can't help you if you lose it)
        </p>
        <p>
          As Dropbox will also tell you, this app will only have read/write
          access to the Apps/AmCAT_Annotator folder in your dropbox. So even if
          you don't trust us we're quite harmless.
        </p>
      </Modal.Content>
      <Modal.Actions>
        <Button primary onClick={startAuthentication}>
          Authenticate
        </Button>
      </Modal.Actions>
    </Modal>
  );
};

export default DropboxConnect;
