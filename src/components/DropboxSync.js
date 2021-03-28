import React, { useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { Menu, Header, Modal, Button } from "semantic-ui-react";
import { setDropbox } from "../actions";

// dropbox endpoints
// https://dropbox.github.io/dropbox-sdk-js/Dropbox.html

const DropboxSync = () => {
  const [open, setOpen] = useState(false);
  const dropbox = useSelector((state) => state.dropbox);
  const dispatch = useDispatch();
  const db = useSelector((state) => state.db);

  const onSync = () => {
    dropbox.writeJSON(["test"], "test.json");
  };

  const onDisconnect = () => {
    if (db) db.deleteToken("dropbox");
    dispatch(setDropbox(null));
  };

  return (
    <Modal
      closeIcon
      open={open}
      trigger={
        <Menu.Item icon="dropbox" name="Sync" style={{ color: "lightblue" }} />
      }
      onClose={() => setOpen(false)}
      onOpen={() => setOpen(true)}
    >
      <Header icon="dropbox" content="Synchronize with Dropbox" />
      <Modal.Content>
        <p>Something about synchronization.</p>
      </Modal.Content>
      <Modal.Actions>
        <Button primary onClick={onSync}>
          Synchronize
        </Button>
        <Button primary onClick={onDisconnect}>
          Disconnect
        </Button>
      </Modal.Actions>
    </Modal>
  );
};

export default DropboxSync;
