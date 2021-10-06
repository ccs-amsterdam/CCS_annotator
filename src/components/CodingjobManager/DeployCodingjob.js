import React, { useState, useEffect } from "react";
import DeploySettings from "./Settings/DeploySettings";
import useJobItems from "hooks/useJobItems";
import { Grid, Header, Button } from "semantic-ui-react";
import fileDownload from "js-file-download";

import { standardizeItems } from "util/standardizeItem";
import { getCodebook } from "util/codebook";

const DeployCodingjob = ({ codingjob }) => {
  const [codingjobPackage, setCodingjobPackage] = useState(null);
  const jobItems = useJobItems(codingjob);

  useEffect(() => {
    if (!jobItems || jobItems.length === 0) return;
    if (!codingjob?.unitSettings || !codingjob?.taskSettings) return;
    createCodingjobPackage(codingjob, jobItems, setCodingjobPackage);
  }, [codingjob, jobItems, setCodingjobPackage]);

  const deployButton = medium => {
    if (!medium) return null;
    switch (codingjob.deploySettings.medium) {
      case "file":
        return <DownloadButton codingjobPackage={codingjobPackage} />;
      case "amcat":
        return <AmcatDeploy codingjobPackage={codingjobPackage} />;
      default:
        return null;
    }
  };

  if (!codingjob) return null;

  return (
    <div>
      <Grid centered stackable columns={2}>
        <Grid.Column stretched width={8}>
          <Header textAlign="center" style={{ background: "#1B1C1D", color: "white" }}>
            Deploy Codingjob
          </Header>
          <DeploySettings codingjob={codingjob} />
          <br />
          {deployButton(codingjob?.deploySettings?.medium)}
        </Grid.Column>
      </Grid>
    </div>
  );
};

const DownloadButton = ({ codingjobPackage }) => {
  const onDownload = async () => {
    const json = [JSON.stringify(codingjobPackage)];
    const blob = new Blob(json, { type: "text/plain;charset=utf-8" });

    try {
      fileDownload(blob, `AmCAT_annotator_${codingjobPackage.title}.json`);
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

const AmcatDeploy = ({ codingjobPackage }) => {
  return <div></div>;
};

const createCodingjobPackage = async (codingjob, jobItems, setCodingjobPackage) => {
  const cjpackage = {
    title: codingjob.name,
    provenance: { unitSettings: codingjob.unitSettings },
    codebook: getCodebook(codingjob.taskSettings),
    items: await standardizeItems(codingjob, jobItems),
    rules: {},
    annotations: [],
  };

  setCodingjobPackage(cjpackage);
};

export default DeployCodingjob;
