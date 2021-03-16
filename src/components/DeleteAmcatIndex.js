import React, { useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { selectAmcatIndex, setAmcatIndices } from "../Actions";
import { Button, Header, Icon, Modal, Dimmer, Loader } from "semantic-ui-react";

const DeleteAmcatIndex = () => {
  const amcat = useSelector((state) => state.amcat);
  const amcatIndex = useSelector((state) => state.amcatIndex);
  const dispatch = useDispatch();

  const [status, setStatus] = useState("inactive");

  const onSubmit = (event) => {
    setStatus("pending");
    console.log(amcatIndex);
    amcat
      .deleteIndex(amcatIndex.name)
      .then((res) => {
        // maybe check for 201 before celebrating
        console.log(res.status);

        if (amcat) {
          amcat.getIndices().then((res) => {
            dispatch(selectAmcatIndex(null));
            dispatch(setAmcatIndices(res.data));
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

  if (!amcatIndex) return null;

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
      <Header icon="trash" content={`Delete Index ${amcatIndex.name}`} />
      <Modal.Content>
        <p>Do you really want to delete this Index?</p>
      </Modal.Content>
      <Modal.Actions>
        {status === "error" ? (
          <div>
            Could not delete index for a reason not yet covered in the error
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

export default DeleteAmcatIndex;
