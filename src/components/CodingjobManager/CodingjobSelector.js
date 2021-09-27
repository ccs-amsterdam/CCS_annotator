import React, { useState, useEffect } from "react";
import { Header, Icon, Button, Segment, Modal, Container } from "semantic-ui-react";
import { selectCodingjob } from "actions";

import SelectionTable from "./SelectionTable";
import CreateCodingjob from "./CreateCodingjob";
import DeleteCodingjob from "./DeleteCodingjob";
import db from "apis/dexie";
import { useLiveQuery } from "dexie-react-hooks";

const CodingjobSelector = ({ codingjob, setSelectedCodingjob, open, setOpen, setMenuItem }) => {
  const codingjobs = useLiveQuery(() => db.listCodingjobs());
  // //const [selectedCodingjob, setSelectedCodingjob] = useState(codingjob);

  // useEffect(() => {
  //   if (selectedCodingjob === null) setCodingjob(null);
  //   if (selectedCodingjob && setCodingjob)
  //     db.getCodingjob(selectedCodingjob).then((cj) => {
  //       setCodingjob({ ...cj, ROW_ID: selectedCodingjob.ROW_ID });
  //     });
  // }, [setCodingjob, selectedCodingjob]);

  // useEffect(() => {
  //   if (!codingjob && codingjobs) {
  //     setSelectedCodingjob(codingjobs.length > 0 ? { ...codingjobs[0], ROW_ID: "0" } : null);
  //   }
  // }, [codingjob, codingjobs]);

  const tableColumns = [
    {
      Header: "Coding job",
      accessor: "name",
      headerClass: "thirteen wide",
    },
  ];

  return (
    <Modal
      centered={false}
      dimmer="blurring"
      open={open}
      onClose={() => {
        if (codingjob) setMenuItem("documents");
        setOpen(false);
      }}
      style={{ width: "50em" }}
      closeOnDimmerClick={true}
    >
      <Header>Select Codingjob</Header>
      <Modal.Content>
        <Segment style={{ border: "0" }}>
          <Button.Group widths="2" size="mini">
            <CreateCodingjob setSelectedCodingjob={setSelectedCodingjob} />
            <DeleteCodingjob codingjob={codingjob} setCodingjob={setSelectedCodingjob} />
          </Button.Group>

          <Container style={{ marginTop: "30px", overflow: "auto", width: "800px" }}>
            <SelectionTable
              columns={tableColumns}
              data={codingjobs ? codingjobs : []}
              selectedRow={codingjob}
              setSelectedRow={setSelectedCodingjob}
              defaultSize={15}
            />
          </Container>
        </Segment>
      </Modal.Content>
      <Modal.Actions>
        <Button
          compact
          textAlign="center"
          color="green"
          disabled={codingjob === null}
          onClick={() => setMenuItem("documents")}
        >
          <Icon name="play" /> Open selected codingjob
        </Button>
      </Modal.Actions>
    </Modal>
  );
};

export default React.memo(CodingjobSelector);
