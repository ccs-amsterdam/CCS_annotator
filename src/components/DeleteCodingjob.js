import React, { useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { selectCodingjob, setCodingjobs } from "../actions";
import { Button, Header, Icon, Modal, Dimmer, Loader } from "semantic-ui-react";

const DeleteCodingjob = () => {
  const db = useSelector((state) => state.db);
  const codingjob = useSelector((state) => state.codingjob);
  const dispatch = useDispatch();

  const [status, setStatus] = useState("inactive");

  const onSubmit = (event) => {
    setStatus("pending");
    db.deleteCodingjob(codingjob)
      .then((res) => {
        // maybe check for 201 before celebrating

        if (db) {
          db.listCodingjobs().then((res) => {
            dispatch(selectCodingjob(null));
            dispatch(setCodingjobs(res));
          });
        }
        setStatus("inactive");
      })
      .catch((e) => {
        console.log(e.message);
        console.log(e);
        setStatus("error");
      });
  };

  if (!codingjob) return null;

  return (
    <Modal
      closeIcon
      open={status !== "inactive"}
      trigger={
        <Button name="logout">
          <Icon name="minus" /> Delete job
        </Button>
      }
      onClose={() => {
        setStatus("inactive");
      }}
      onOpen={() => {
        setStatus("awaiting input");
      }}
    >
      <Header icon="trash" content={`Delete codingjob ${codingjob.name}`} />
      <Modal.Content>
        <p>Do you really want to delete this codingjob?</p>
      </Modal.Content>
      <Modal.Actions>
        {status === "error" ? (
          <div>
            Could not delete codingjob for a reason not yet covered in the error
            handling...
          </div>
        ) : null}
        {status === "pending" ? (
          <Dimmer active inverted>
            <Loader content="Creating codingjob" />
          </Dimmer>
        ) : (
          <>
            <Button color="red" onClick={onSubmit}>
              <Icon name="remove" /> No
            </Button>
            <Button color="green" onClick={onSubmit}>
              <Icon name="checkmark" /> Yes
            </Button>
          </>
        )}
      </Modal.Actions>
    </Modal>
  );
};

export default DeleteCodingjob;
