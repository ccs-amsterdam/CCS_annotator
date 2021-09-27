import React, { useState } from "react";
import { Header, Button, Modal, Form, Loader, Dimmer, Icon } from "semantic-ui-react";
import db from "apis/dexie";

const CreateCodingjob = ({ setSelectedCodingjob }) => {
  const [status, setStatus] = useState("inactive");
  const [codingjobName, setCodingjobName] = useState("");

  const onSubmit = async (event) => {
    event.preventDefault();

    setCodingjobName(codingjobName.trim());
    setStatus("pending");

    try {
      await db.createCodingjob(codingjobName);
      const codingjobs = await db.listCodingjobs();
      setSelectedCodingjob(null);
      setStatus("inactive");
    } catch (e) {
      console.log(e);
      setStatus("error");
    }
  };

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
            Could not create codingjob for a reason not yet covered in the error handling...
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
