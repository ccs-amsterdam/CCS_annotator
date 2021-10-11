import React, { useEffect } from "react";
import { Header, Button, Segment, Container, Grid } from "semantic-ui-react";

import SelectionTable from "./SelectionTable";
import CreateCodingjob from "./CreateCodingjob";
import DeleteCodingjob from "./DeleteCodingjob";
import db from "apis/dexie";
import { demo_articles, demo_codebook } from "apis/demodata";
import { useLiveQuery } from "dexie-react-hooks";

const CodingjobSelector = ({ codingjob, setSelectedCodingjob }) => {
  const codingjobs = useLiveQuery(() => db.idb.codingjobs.toArray());

  useEffect(() => {
    if (!codingjob?.job_id && codingjobs) {
      setSelectedCodingjob(codingjobs.length > 0 ? { ...codingjobs[0], ROW_ID: "0" } : null);
    }
  }, [codingjob, codingjobs, setSelectedCodingjob]);

  const tableColumns = [
    {
      Header: "Coding job",
      accessor: "name",
      headerClass: "thirteen wide",
    },
  ];

  const table = () => {
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
        data={codingjobs ? codingjobs : []}
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
            <CreateCodingjob setSelectedCodingjob={setSelectedCodingjob} />
            <DeleteCodingjob codingjob={codingjob} setCodingjob={setSelectedCodingjob} />
          </Button.Group>

          <Container style={{ marginTop: "30px", overflow: "auto", width: "800px" }}>
            {table()}
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

export default React.memo(CodingjobSelector);
