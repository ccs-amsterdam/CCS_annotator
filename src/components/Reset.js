import React, { useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { resetDB } from "../actions";
import { Menu, Button, Header, Icon, Modal } from "semantic-ui-react";
import { useHistory } from "react-router-dom";

const Reset = ({ homepage }) => {
  const db = useSelector((state) => state.db);
  const dispatch = useDispatch();
  const [open, setOpen] = useState(false);
  const history = useHistory();

  if (!db) return null;

  return (
    <Modal
      closeIcon
      open={open}
      trigger={
        <Menu.Item icon="rocket" name="Reset" style={{ color: "#d7a3a3" }} />
      }
      onClose={() => setOpen(false)}
      onOpen={() => setOpen(true)}
    >
      <Header icon="power off" content="Reset Annotator Database" />
      <Modal.Content>
        <p>
          This will remove all document and annotation data from your browser.
          Any annotations that have not been saved/synchronized will be lost.
          Are you absolutely sure?
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
        <Button
          color="green"
          onClick={() => {
            console.log(db);
            db.deleteDB()
              .then(() => {
                dispatch(resetDB());
                setOpen(false);
                history.push(homepage);
              })
              .catch((e) => {
                console.log(e);
              });
          }}
        >
          <Icon name="checkmark" /> Yes
        </Button>
      </Modal.Actions>
    </Modal>
  );
};

export default Reset;
