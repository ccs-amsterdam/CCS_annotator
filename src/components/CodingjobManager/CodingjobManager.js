import React, { useEffect, useState, useRef } from "react";
import { useSelector } from "react-redux";

import { Container, Segment, Step } from "semantic-ui-react";

import PickCodingjob from "./PickCodingjob";
import ManageDocuments from "./ManageDocuments";
import db from "apis/dexie";
import { useLiveQuery } from "dexie-react-hooks";
import SetCodingUnit from "./setCodingUnit";

const CodingjobManager = () => {
  const [codingjob, setCodingjob] = useState(null);
  const [menuItem, setMenuItem] = useState("codingjobs");
  const totalItems = useRef(0);

  const nDocuments = useLiveQuery(() => {
    if (!codingjob) return "...";
    return db.idb.documents.where("job_id").equals(codingjob.job_id).count();
  }, [codingjob]);

  const renderSwitch = (menuItem) => {
    switch (menuItem) {
      case "codingjobs":
        return <PickCodingjob codingjob={codingjob} setCodingjob={setCodingjob} />;
      case "documents":
        return <ManageDocuments codingjob={codingjob} />;
      case "units":
        return <SetCodingUnit codingjob={codingjob} />;
      default:
        return null;
    }
  };

  return (
    <Container style={{ margin: "1em", overflow: "auto" }}>
      <Step.Group>
        <Step
          title="Select codingjob"
          description={codingjob ? codingjob.name : "none selected"}
          active={menuItem === "codingjobs"}
          onClick={(e, d) => setMenuItem("codingjobs")}
        />
        <Step
          title="Manage documents"
          description={`${nDocuments} in set`}
          active={menuItem === "documents"}
          onClick={(e, d) => setMenuItem("documents")}
        />
        <Step
          title="Coding unit"
          description="Specify the coding unit"
          completed={true}
          active={menuItem === "units"}
          onClick={(e, d) => setMenuItem("units")}
        />
      </Step.Group>

      <Segment attached="bottom">{renderSwitch(menuItem)}</Segment>
    </Container>
  );
};

export default React.memo(CodingjobManager);
