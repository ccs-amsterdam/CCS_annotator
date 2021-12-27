import React, { useState, useEffect } from "react";
import DeploySettings from "./subcomponents/DeploySettings";
import useUnits from "components/CodingjobManager/subcomponents/useUnits";
import { Grid, Header } from "semantic-ui-react";
import FileDeploy from "./subcomponents/FileDeploy";
import AmcatDeploy from "./subcomponents/AmcatDeploy";

import db from "apis/dexie";
import { standardizeUnits } from "library/standardizeUnits";
import { getCodebook } from "library/codebook";
import DeployedJobs from "./subcomponents/DeployedJobs";

const DeployCodingjob = ({ codingjob }) => {
  const [codingjobPackage, setCodingjobPackage] = useState(null);
  const [units] = useUnits(codingjob);

  useEffect(() => {
    if (!units || units.length === 0) return;
    if (!codingjob?.unitSettings || !codingjob?.taskSettings || !codingjob?.deploySettings) return;

    const includeDocuments = codingjob.deploySettings.medium === "file";
    createCodingjobPackage(codingjob, units, setCodingjobPackage, includeDocuments);
  }, [codingjob, units, setCodingjobPackage]);

  const deployButton = (medium) => {
    if (!medium) return null;
    switch (codingjob.deploySettings.medium) {
      case "file":
        return <FileDeploy codingjobPackage={codingjobPackage} />;
      case "amcat":
        return <AmcatDeploy codingjobPackage={codingjobPackage} />;
      default:
        return null;
    }
  };

  const viewDeployed = () => {
    if (!codingjob?.deploySettings?.medium) return null;
    if (codingjob.deploySettings.medium !== "amcat") return null;
    return (
      <Grid.Column width={11}>
        <Header textAlign="center" style={{ background: "#1B1C1D", color: "white" }}>
          Jobs deployed on AmCAT
        </Header>
        <DeployedJobs />
      </Grid.Column>
    );
  };

  if (!codingjob) return null;

  return (
    <div>
      <Grid centered stackable columns={2}>
        <Grid.Column width={5}>
          <Header textAlign="center" style={{ background: "#1B1C1D", color: "white" }}>
            Deploy Codingjob
          </Header>
          <DeploySettings codingjob={codingjob} />
          <br />
          {deployButton(codingjob?.deploySettings?.medium)}
        </Grid.Column>
        {viewDeployed()}
      </Grid>
    </div>
  );
};

const createCodingjobPackage = async (
  codingjob,
  units,
  setCodingjobPackage,
  includeDocuments = false
) => {
  let sunits = await standardizeUnits(codingjob, units);
  sunits = sunits.map((su) => {
    return {
      unit: su,
      //gold: {}
    };
  });

  const cjpackage = {
    title: codingjob.name,
    provenance: { unitSettings: codingjob.unitSettings, deploySettings: codingjob.deploySettings },
    codebook: getCodebook(codingjob.taskSettings),
    units: sunits,
    rules: { ruleset: "crowdcoding" },
  };

  if (includeDocuments)
    cjpackage.provenance.documents = await db.idb.documents
      .where("job_id")
      .equals(codingjob.id)
      .toArray();

  setCodingjobPackage(cjpackage);
};

export default DeployCodingjob;
