import React, { useState } from "react";

import { Segment, Step } from "semantic-ui-react";

import db from "apis/dexie";
import { useLiveQuery } from "dexie-react-hooks";

import CodingjobSelector from "./CodingjobSelector";
import ManageDocuments from "./ManageDocuments";
import ManageCodingUnits from "./ManageCodingUnits";
import ManageTask from "./ManageTask";
import DeployCodingjob from "./DeployCodingjob";

const CodingjobManager = () => {
  const [menuItem, setMenuItem] = useState("codingjobs");
  const [selectedCodingjob, setSelectedCodingjob] = useState(null);

  const codingjob = useLiveQuery(() => {
    // retrieve codingjob from Dexie whenever selectedCodingjob changes OR dexie is updated
    if (selectedCodingjob) {
      return db.idb.codingjobs.get(selectedCodingjob.job_id).then(cj => {
        return { ...cj, ROW_ID: selectedCodingjob.ROW_ID };
      });
    }
  }, [selectedCodingjob]);

  const nDocuments = useLiveQuery(() => {
    if (!codingjob) return 0;
    return db.idb.documents
      .where("job_id")
      .equals(codingjob.job_id)
      .count();
  }, [codingjob]);

  const renderSwitch = menuItem => {
    switch (menuItem) {
      case "codingjobs":
        return (
          <CodingjobSelector codingjob={codingjob} setSelectedCodingjob={setSelectedCodingjob} />
        );
      case "documents":
        return <ManageDocuments codingjob={codingjob} />;
      case "units":
        return <ManageCodingUnits codingjob={codingjob} />;
      case "task":
        return <ManageTask codingjob={codingjob} />;
      case "deploy":
        return <DeployCodingjob codingjob={codingjob} />;
      default:
        return null;
    }
  };
  return (
    <div style={{ margin: "1em", overflow: "auto" }}>
      <Step.Group ordered unstackable size="tiny">
        <Step
          title="Codingjob"
          description={codingjob ? codingjob.name : "none selected"}
          active={menuItem === "codingjobs"}
          completed={codingjob !== null && codingjob != null}
          onClick={(e, d) => {
            setMenuItem("codingjobs");
          }}
        />
        <Step
          title="Documents"
          description={nDocuments > 0 ? `${nDocuments} documents` : ""}
          active={menuItem === "documents"}
          completed={nDocuments > 0}
          disabled={codingjob === null}
          onClick={(e, d) => setMenuItem("documents")}
        />
        <Step
          title="Units"
          description={
            codingjob?.codebook?.unitSettings?.n
              ? `${codingjob?.codebook?.unitSettings?.n} units`
              : null
          }
          active={menuItem === "units"}
          completed={codingjob?.codebook?.unitSettings?.n}
          disabled={codingjob === null}
          onClick={(e, d) => setMenuItem("units")}
        />
        <Step
          title="Task"
          description={codingjob?.codebook?.taskSettings?.type || "Define the task"}
          active={menuItem === "task"}
          completed={codingjob?.codebook?.taskSettings?.type}
          disabled={codingjob === null}
          onClick={(e, d) => setMenuItem("task")}
        />
        <Step
          title="Deploy"
          description={"Get (others) to work"}
          active={menuItem === "deploy"}
          disabled={
            codingjob === null ||
            !codingjob?.codebook?.unitSettings?.n ||
            !codingjob?.codebook?.taskSettings?.type
          }
          onClick={(e, d) => setMenuItem("deploy")}
        />
      </Step.Group>

      <Segment style={{ border: "0" }} attached="bottom">
        {renderSwitch(menuItem)}
      </Segment>
    </div>
  );
};

export default React.memo(CodingjobManager);
