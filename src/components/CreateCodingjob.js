import React, { useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { selectCodingjob, setCodingjobs } from "../actions";
import {
  Header,
  Button,
  Modal,
  Form,
  Loader,
  Dimmer,
  Icon,
} from "semantic-ui-react";

const CreateCodingjob = () => {
  const db = useSelector((state) => state.db);
  const codingjobs = useSelector((state) => state.codingjobs);
  const dispatch = useDispatch();

  const [status, setStatus] = useState("inactive");
  const [codingjobName, setCodingjobName] = useState("");

  const onSubmit = (event) => {
    event.preventDefault();

    setCodingjobName(codingjobName.trim());
    setStatus("pending");

    db.createCodingjob(codingjobName)
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
        console.log(e);
        setStatus("error");
      });
  };

  if (!codingjobs) return null;

  return (
    <Modal
      as={Form}
      trigger={
        <Button>
          <Icon name="plus" />
          Create job
        </Button>
      }
      onSubmit={(e) => onSubmit(e)}
      open={status !== "inactive"}
      onClose={() => setStatus("inactive")}
      onOpen={() => {
        setCodingjobName("");
        setStatus("awaiting input");
      }}
      size="tiny"
    >
      <Header icon="pencil" content="Create new Codingjob" as="h2" />
      <Modal.Content>
        <Form.Group>
          <Form.Input
            width={12}
            label="Name"
            required
            type="text"
            value={codingjobName}
            onChange={(e, d) => {
              setStatus("awaiting input");
              setCodingjobName(d.value);
            }}
            placeholder="Enter name"
          />
        </Form.Group>
      </Modal.Content>
      <Modal.Actions>
        {status === "error" ? (
          <div>
            Could not create codingjob for a reason not yet covered in the error
            handling...
          </div>
        ) : null}
        {status === "pending" ? (
          <Dimmer active inverted>
            <Loader content="Creating codingjob" />
          </Dimmer>
        ) : (
          <Button type="submit" color="green" icon="save" content="Create" />
        )}
      </Modal.Actions>
    </Modal>
  );
};

export default CreateCodingjob;
