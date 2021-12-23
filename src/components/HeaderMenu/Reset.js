import React, { useState } from "react";
import { Menu, Button, Header, Icon, Modal } from "semantic-ui-react";
import { useHistory } from "react-router-dom";
import db from "apis/dexie";

const Reset = () => {
  const [open, setOpen] = useState(false);
  const history = useHistory();

  const onClick = async () => {
    try {
      await db.deleteDB();
      setOpen(false);
      history.push("/");
    } catch (e) {
      console.log(e);
    }
  };

  return (
    <Modal
      closeIcon
      open={open}
      trigger={<Menu.Item icon="rocket" name="Reset" style={{ color: "#d7a3a3" }} />}
      onClose={() => setOpen(false)}
      onOpen={() => setOpen(true)}
    >
      <Header icon="power off" content="Reset Annotator Database" />
      <Modal.Content>
        <p>
          This will remove all documents and annotations from your browser. Anything that hasn't
          been exported will be lost. Are you absolutely sure?
        </p>
      </Modal.Content>
      <Modal.Actions>
        <Button
          color="red"
          onClick={() => {
            setOpen(false);
          }}
        >
          <Icon name="remove" /> No
        </Button>
        <Button color="green" onClick={onClick}>
          <Icon name="checkmark" /> Yes
        </Button>
      </Modal.Actions>
    </Modal>
  );
};

export default Reset;
