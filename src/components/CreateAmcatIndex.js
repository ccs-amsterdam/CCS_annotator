import React, { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { selectAmcatIndex, setAmcatIndices } from "../Actions";
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

const CreateAmcatIndex = () => {
  const amcat = useSelector((state) => state.amcat);
  const amcatIndices = useSelector((state) => state.amcatIndices);
  const dispatch = useDispatch();

  const [status, setStatus] = useState("inactive");
  const [amcatIndexName, setAmcatIndexName] = useState("");
  const [guestRole, setGuestRole] = useState("NONE");
  const [nameError, setNameError] = useState(null);

  useEffect(() => {
    if (amcatIndexName.match(/[ "*|<>/?,A-Z]/)) {
      const invalid = amcatIndexName.match(/[ "*|<>/?]/gi);
      let uniqueInvalid = [...new Set(invalid)].map((c) =>
        c === " " ? "space" : c
      );
      if (amcatIndexName.match(/[A-Z]/)) uniqueInvalid.push("UPPERCASE");
      setNameError(`Illegal symbols: ${uniqueInvalid.join(" ")}`);
    } else {
      setNameError(null);
    }
  }, [amcatIndexName]);

  const onSubmit = (event) => {
    event.preventDefault();

    setAmcatIndexName(amcatIndexName.trim());
    if (amcatIndices.some((o) => o.name === amcatIndexName)) {
      setNameError("This Index name already exists");
      return;
    }

    setStatus("pending");
    amcat
      .createIndex(amcatIndexName, guestRole)
      .then((res) => {
        // maybe check for 201 before celebrating

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

  if (!amcatIndices) return null;

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
        setAmcatIndexName("");
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
            value={amcatIndexName}
            onChange={(e, d) => {
              setStatus("awaiting input");
              setAmcatIndexName(d.value);
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

export default CreateAmcatIndex;
