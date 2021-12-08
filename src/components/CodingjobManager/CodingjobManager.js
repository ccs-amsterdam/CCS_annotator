import React, { useState } from "react";

import { Segment, Step } from "semantic-ui-react";

import db from "apis/dexie";
import { useLiveQuery } from "dexie-react-hooks";

import CodingjobSelector from "./1_CodingjobSelector";
import ManageDocuments from "./2_ManageDocuments";
import ManageCodingUnits from "./3_ManageCodingUnits";
import ManageTask from "./4_ManageTask";
import DeployCodingjob from "./5_DeployCodingjob";

const CodingjobManager = () => {
  const [menuItem, setMenuItem] = useState("codingjobs");
  const [selectedCodingjob, setSelectedCodingjob] = useState(null);

  const codingjob = useLiveQuery(() => {
    // retrieve codingjob from Dexie whenever selectedCodingjob changes OR dexie is updated
    if (selectedCodingjob) {
      return db.idb.codingjobs
        .get(selectedCodingjob.job_id)
        .then((cj) => {
          return { ...cj, ROW_ID: selectedCodingjob.ROW_ID };
        })
        .catch((e) => {
          console.log(e);
        });
    } else return null;
  }, [selectedCodingjob]);

  const nDocuments = useLiveQuery(() => {
    if (!codingjob?.job_id) return 0;
    return db.idb.documents.where("job_id").equals(codingjob.job_id).count();
  }, [codingjob]);

  const renderSwitch = (menuItem) => {
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
    <div style={{ margin: "1em" }}>
      <Step.Group ordered unstackable size="tiny" style={{ width: "100%", overflow: "auto" }}>
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
            codingjob?.unitSettings?.n
              ? `${codingjob?.unitSettings?.n} units ${
                  codingjob?.unitSettings.annotationMix ? `(+random)` : ""
                }`
              : null
          }
          active={menuItem === "units"}
          completed={codingjob?.unitSettings?.n}
          disabled={nDocuments === 0}
          onClick={(e, d) => setMenuItem("units")}
        />
        <Step
          title="Task"
          description={codingjob?.taskSettings?.type || "Define the task"}
          active={menuItem === "task"}
          completed={codingjob?.taskSettings?.type}
          disabled={!codingjob?.unitSettings?.n}
          onClick={(e, d) => setMenuItem("task")}
        />
        <Step
          title="Deploy"
          description={"Get (others) to work"}
          active={menuItem === "deploy"}
          disabled={
            codingjob === null || !codingjob?.unitSettings?.n || !codingjob?.taskSettings?.type
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
