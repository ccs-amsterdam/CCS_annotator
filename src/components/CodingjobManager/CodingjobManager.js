import React, { useEffect, useState, useRef } from "react";
import { useSelector } from "react-redux";

import { Container, Segment, Step } from "semantic-ui-react";

import ManageDocuments from "./ManageDocuments";
import db from "apis/dexie";
import { useLiveQuery } from "dexie-react-hooks";
import SetCodingUnit from "./setCodingUnit";
import CodingjobSelector from "./CodingjobSelector";

const CodingjobManager = () => {
  const [menuItem, setMenuItem] = useState("codingjobs");
  const [openCodingjobSelector, setOpenCodingjobSelector] = useState(false);
  const [selectedCodingjob, setSelectedCodingjob] = useState(null);

  const codingjob = useLiveQuery(() => {
    // retrieve codingjob from Dexie whenever selectedCodingjob changes OR dexie is updated
    if (selectedCodingjob) {
      return db.getCodingjob(selectedCodingjob).then((cj) => {
        return { ...cj, ROW_ID: selectedCodingjob.ROW_ID };
      });
    }
  }, [selectedCodingjob]);

  const nDocuments = useLiveQuery(() => {
    if (!codingjob) return 0;
    return db.idb.documents.where("job_id").equals(codingjob.job_id).count();
  }, [codingjob]);

  const renderSwitch = (menuItem) => {
    switch (menuItem) {
      case "codingjobs":
        return (
          <CodingjobSelector
            codingjob={codingjob}
            setSelectedCodingjob={setSelectedCodingjob}
            open={openCodingjobSelector}
            setOpen={setOpenCodingjobSelector}
            setMenuItem={setMenuItem}
          />
        );
      case "documents":
        return <ManageDocuments codingjob={codingjob} />;
      case "units":
        return <SetCodingUnit codingjob={codingjob} />;
      default:
        return null;
    }
  };

  return (
    <Container style={{ margin: "1em" }}>
      <Step.Group ordered size="tiny">
        <Step
          title="Codingjob"
          description={codingjob ? codingjob.name : "none selected"}
          active={menuItem === "codingjobs"}
          completed={codingjob !== null}
          onClick={(e, d) => {
            setMenuItem("codingjobs");
            setOpenCodingjobSelector(true);
          }}
        />
        <Step
          title="Documents"
          description={nDocuments === 0 ? "" : `${nDocuments} in set`}
          active={menuItem === "documents"}
          completed={nDocuments > 0}
          disabled={codingjob === null}
          onClick={(e, d) => setMenuItem("documents")}
        />
        <Step
          title="Coding unit"
          description="Specify the coding unit"
          active={menuItem === "units"}
          completed={codingjob?.unitSettings?.textUnit}
          disabled={codingjob === null}
          onClick={(e, d) => setMenuItem("units")}
        />
      </Step.Group>

      <Segment style={{ border: "0" }} attached="bottom">
        {renderSwitch(menuItem)}
      </Segment>
    </Container>
  );
};

export default React.memo(CodingjobManager);
