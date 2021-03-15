import React, { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { selectIndex, setIndices } from "../Actions";
import {
  Header,
  Button,
  Modal,
  Form,
  Dropdown,
  Loader,
  Dimmer,
  Icon,
} from "semantic-ui-react";

const guestRoles = [
  { key: 0, value: "NONE", text: "No access" },
  { key: 10, value: "METAREADER", text: "Meta-reader" },
  { key: 20, value: "READER", text: "Reader" },
  { key: 30, value: "WRITER", text: "Writer" },
  { key: 40, value: "ADMIN", text: "Admin" },
];

const CreateIndexModal = () => {
  const session = useSelector((state) => state.session);
  const indices = useSelector((state) => state.indices);
  const dispatch = useDispatch();

  const [status, setStatus] = useState("inactive");
  const [indexName, setIndexName] = useState("");
  const [guestRole, setGuestRole] = useState("NONE");
  const [nameError, setNameError] = useState(null);

  useEffect(() => {
    if (indexName.match(/[ "*|<>/?,A-Z]/)) {
      const invalid = indexName.match(/[ "*|<>/?]/gi);
      let uniqueInvalid = [...new Set(invalid)].map((c) =>
        c === " " ? "space" : c
      );
      if (indexName.match(/[A-Z]/)) uniqueInvalid.push("UPPERCASE");
      setNameError(`Illegal symbols: ${uniqueInvalid.join(" ")}`);
    } else {
      setNameError(null);
    }
  }, [indexName]);

  const onSubmit = (event) => {
    event.preventDefault();

    setIndexName(indexName.trim());
    console.log(indexName);
    if (indices.some((o) => o.name === indexName)) {
      setNameError("This Index name already exists");
      return;
    }

    setStatus("pending");
    session
      .createIndex(indexName, guestRole)
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

  if (!indices) return null;

  return (
    <Modal
      as={Form}
      trigger={
        <Button primary>
          <Icon name="plus" />
          Create new index
        </Button>
      }
      onSubmit={(e) => onSubmit(e)}
      open={status !== "inactive"}
      onClose={() => setStatus("inactive")}
      onOpen={() => {
        setIndexName("");
        setGuestRole("NONE");
        setStatus("awaiting input");
      }}
      size="tiny"
    >
      <Header icon="pencil" content="Create new index" as="h2" />
      <Modal.Content>
        <Form.Group>
          <Form.Input
            width={12}
            label="Name"
            required
            type="text"
            error={nameError ? nameError : null}
            value={indexName}
            onChange={(e, d) => {
              setStatus("awaiting input");
              setIndexName(d.value);
            }}
            placeholder="Enter name"
          />
          <div>
            <b>Guest role</b>
            <br />
            <Form.Input
              width={4}
              label="Name"
              as={Dropdown}
              selection
              value={guestRole}
              onChange={(e, d) => {
                setGuestRole(d.value);
              }}
              options={guestRoles}
            />
          </div>
        </Form.Group>
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
          <Button type="submit" color="green" icon="save" content="Create" />
        )}
      </Modal.Actions>
    </Modal>
  );
};

export default CreateIndexModal;
