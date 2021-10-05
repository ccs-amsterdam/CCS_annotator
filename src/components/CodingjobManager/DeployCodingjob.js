import React, { useState, useEffect } from "react";
import DeploySettings from "./Settings/DeploySettings";
import useJobItems from "hooks/useJobItems";
import { Grid, Header, Button } from "semantic-ui-react";
import fileDownload from "js-file-download";

import objectHash from "object-hash";
import { standardizeItems } from "util/standardizeItem";

const DeployCodingjob = ({ codingjob }) => {
  const [codingjobPackage, setCodingjobPackage] = useState(null);
  const jobItems = useJobItems(codingjob);

  useEffect(() => {
    if (!jobItems || jobItems.length === 0) return;
    if (!codingjob?.codebook?.unitSettings || !codingjob?.codebook?.taskSettings) return;
    createCodingjobPackage(codingjob, jobItems, setCodingjobPackage);
  }, [codingjob, jobItems, setCodingjobPackage]);

  if (!codingjob) return null;

  return (
    <div>
      <Grid centered stackable columns={2}>
        <Grid.Column stretched width={4}>
          <Header textAlign="center" style={{ background: "#1B1C1D", color: "white" }}>
            Codingjob packages
          </Header>
          <DeploySettings codingjob={codingjob} />
          <DownloadButton codingjobPackage={codingjobPackage} />
        </Grid.Column>
      </Grid>
    </div>
  );
};

const DownloadButton = ({ codingjobPackage }) => {
  const onDownload = async () => {
    const now = new Date();
    const datestring = now.toISOString().slice(0, 19).replace(/T/g, " ");
    const json = [JSON.stringify(codingjobPackage)];
    const blob = new Blob(json, { type: "text/plain;charset=utf-8" });

    try {
      fileDownload(blob, `${codingjobPackage.name}_${datestring}.json`);
    } catch (error) {
      console.error("" + error);
    }
  };

  return (
    <Button loading={codingjobPackage === null} onClick={onDownload}>
      Download Codingjob
    </Button>
  );
};

const createCodingjobPackage = async (codingjob, jobItems, setCodingjobPackage) => {
  const cjpackage = {
    codebook: { ...codingjob.codebook },
    items: await standardizeItems(codingjob, jobItems),
  };

  // keep only the selected task type??
  // pros: seems silly not to, cons: loses information
  const taskType = cjpackage.codebook.taskSettings.type;
  cjpackage.codebook.taskSettings = {
    type: taskType,
    [taskType]: cjpackage.codebook.taskSettings[taskType],
  };

  cjpackage.name = codingjob.name;
  cjpackage.last_modified = new Date();
  cjpackage.id = objectHash(cjpackage);
  cjpackage.medium = setCodingjobPackage(cjpackage);
};

export default DeployCodingjob;
