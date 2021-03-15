import React, { useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { selectIndex, setIndices } from "../Actions";
import { Button, Header, Icon, Modal, Dimmer, Loader } from "semantic-ui-react";

const DeleteIndexModal = () => {
  const session = useSelector((state) => state.session);
  const index = useSelector((state) => state.index);
  const dispatch = useDispatch();

  const [status, setStatus] = useState("inactive");

  const onSubmit = (event) => {
    setStatus("pending");
    session
      .deleteIndex(index.name)
      .then((res) => {
        // maybe check for 201 before celebrating
        console.log(res.status);

        if (session) {
          session.getIndices().then((res) => {
            dispatch(selectIndex(null));
            dispatch(setIndices(res.data));
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

  if (!index) return null;

  return (
    <Modal
      closeIcon
      open={status !== "inactive"}
      trigger={
        <Button name="logout">
          <Icon name="minus" /> Delete Index
        </Button>
      }
      onClose={() => {
        setStatus("inactive");
      }}
      onOpen={() => {
        setStatus("awaiting input");
      }}
    >
      <Header icon="trash" content={`Delete Index ${index.name}`} />
      <Modal.Content>
        <p>Do you really want to delete this Index?</p>
      </Modal.Content>
      <Modal.Actions>
        {status === "error" ? (
          <div>
            Could not create index for a reason not yet covered in the error
            handling...
          </div>
        ) : null}
        {status === "pending" ? (
          <Dimmer active inverted>
            <Loader content="Creating Index" />
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

export default DeleteIndexModal;
