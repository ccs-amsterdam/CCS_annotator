import React, { useEffect, useState } from "react";
import {
  Header,
  Button,
  Modal,
  Form,
  Loader,
  Dimmer,
  Icon,
  Segment,
  Container,
  Grid,
} from "semantic-ui-react";

import SelectionTable from "./subcomponents/SelectionTable";
import db from "apis/dexie";
import { demo_articles, demo_codebook } from "apis/demodata";
import { useLiveQuery } from "dexie-react-hooks";

const tableColumns = [
  {
    Header: "Coding job",
    accessor: "name",
    headerClass: "thirteen wide",
  },
];

const CodingjobSelector = ({ codingjob, setSelectedCodingjob }) => {
  const codingjobs = useLiveQuery(() => db.idb.codingjobs.toArray());

  useEffect(() => {
    // If no codingjob is selected, pick the top row
    if (!codingjob?.job_id && codingjobs) {
      setSelectedCodingjob(codingjobs.length > 0 ? { ...codingjobs[0], ROW_ID: "0" } : null);
    }
  }, [codingjob, codingjobs, setSelectedCodingjob]);

  useEffect(() => {
    // if codingjob does not have a row_id (for table row selection), look up the index from codingjobs
    if (!codingjobs) return;
    if (codingjob?.ROW_ID != null) return;
    if (!codingjob?.job_id) return;
    for (let i = 0; i < codingjobs.length; i++) {
      if (codingjobs[i].job_id === codingjob.job_id) {
        setSelectedCodingjob({ ...codingjob, ROW_ID: String(i) });
        return;
      }
    }
  }, [codingjob, codingjobs, setSelectedCodingjob]);

  const table = (data) => {
    if (!codingjobs) return null;
    if (codingjobs.length === 0)
      return (
        <div style={{ textAlign: "center" }}>
          <Button primary onClick={() => createDemoJob()}>
            Create Demo job
          </Button>
        </div>
      );
    return (
      <SelectionTable
        columns={tableColumns}
        data={data}
        selectedRow={codingjob}
        setSelectedRow={setSelectedCodingjob}
        defaultSize={15}
      />
    );
  };

  return (
    <Grid centered stackable columns={1}>
      <Grid.Column width={6}>
        <Header textAlign="center" style={{ background: "#1B1C1D", color: "white" }}>
          Select Codingjob
        </Header>
        <Segment style={{ border: "0" }}>
          <Button.Group widths="2" size="mini">
            <CreateCodingjob setSelectedCodingjob={setSelectedCodingjob} codingjobs={codingjobs} />
            <DeleteCodingjob codingjob={codingjob} setCodingjob={setSelectedCodingjob} />
          </Button.Group>

          <Container style={{ marginTop: "30px", overflow: "auto", width: "800px" }}>
            {table(codingjobs ? codingjobs : [])}
          </Container>
        </Segment>
      </Grid.Column>
    </Grid>
  );
};

const createDemoJob = async () => {
  try {
    const exists = await db.idb.codingjobs.get({ name: "Demo codingjob" });
    if (exists) return null;
    const job = await db.createCodingjob("Demo codingjob");
    await db.createDocuments(job, demo_articles, true);
    await db.writeCodebook(job, demo_codebook);
    return null;
  } catch (e) {
    console.log(e);
  }
};

const CreateCodingjob = ({ setSelectedCodingjob, codingjobs }) => {
  const [status, setStatus] = useState("inactive");
  const [codingjobName, setCodingjobName] = useState("");

  const onSubmit = async (event) => {
    event.preventDefault();

    setCodingjobName(codingjobName.trim());
    setStatus("pending");

    try {
      const cj = await db.createCodingjob(codingjobName);
      if (codingjobs.length > 0) setSelectedCodingjob(cj);
      //setMenuItem("documents");
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

const DeleteCodingjob = ({ codingjob, setCodingjob }) => {
  const [status, setStatus] = useState("inactive");

  const onSubmit = async (event) => {
    setStatus("pending");
    try {
      await db.deleteCodingjob(codingjob);
      setCodingjob(null);

      setStatus("inactive");
    } catch (e) {
      setStatus("error");
    }
  };

  if (!codingjob?.job_id) return null;

  return (
    <Modal
      closeIcon
      open={status !== "inactive"}
      trigger={
        <Button compact>
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
            Could not delete codingjob for a reason not yet covered in the error handling...
          </div>
        ) : null}
        {status === "pending" ? (
          <Dimmer active inverted>
            <Loader content="Deleting codingjob" />
          </Dimmer>
        ) : (
          <>
            <Button
              color="red"
              onClick={() => {
                setStatus("inactive");
              }}
            >
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

export default React.memo(CodingjobSelector);
