import React, { useState, useEffect } from "react";
import DeploySettings from "./subcomponents/DeploySettings";
import useUnits from "components/CodingjobManager/subcomponents/useUnits";
import { Grid, Header, Button, Form } from "semantic-ui-react";
import { saveAs } from "file-saver";
import JSZip from "jszip";

import db from "apis/dexie";
import { drawRandom } from "library/sample";
import { standardizeUnits } from "library/standardizeUnits";
import { getCodebook } from "library/codebook";
import DeployedJobs from "./subcomponents/DeployedJobs";
import { useCookies } from "react-cookie";
import newAmcatSession from "apis/amcat";
import { LoginForm } from "components/HeaderMenu/Login";

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
        return <DownloadButton codingjobPackage={codingjobPackage} />;
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

const DownloadButton = ({ codingjobPackage }) => {
  const [title, setTitle] = useState("");

  useEffect(() => {
    if (codingjobPackage?.title) setTitle(codingjobPackage.title);
  }, [codingjobPackage]);

  const onDownload = async () => {
    const cjSets = createCoderSets(codingjobPackage);

    const zip = new JSZip();
    zip.file(`AmCAT_annotator_${title}.json`, JSON.stringify(codingjobPackage));
    for (let i = 0; i < cjSets.length; i++) {
      const fname = `set_${cjSets[i].set}_units_${cjSets[i].units.length}_${title}.json`;
      zip.file(fname, JSON.stringify(cjSets[i]));
    }

    const content = await zip.generateAsync({ type: "blob" });
    saveAs(content, `AmCAT_annotator_${title}.zip`);

    // codingjobPackage.title = title;
    // const json = [JSON.stringify(codingjobPackage)];
    // const blob = new Blob(json, { type: "text/plain;charset=utf-8" });

    // try {
    //   fileDownload(blob, `AmCAT_annotator_${codingjobPackage.title}.json`);
    //   //const url = objectHash(codingjobPackage);
    //   //db.uploadTask(codingjobPackage, url, "local");
    // } catch (error) {
    //   console.error("" + error);
    // }
  };

  return (
    <div>
      <Form onSubmit={() => onDownload()}>
        <Form.Input
          placeholder="username"
          value={title}
          maxLength={30}
          onChange={(e, d) => setTitle(d.value)}
          autoFocus
          style={{ width: "100%" }}
        />
      </Form>
      <br />

      <Button
        primary
        fluid
        loading={codingjobPackage === null}
        disabled={title.length < 5}
        onClick={onDownload}
      >
        {title.length < 5 ? "please use 5 characters or more" : "Download codingjob files"}{" "}
      </Button>
    </div>
  );
};

const AmcatDeploy = ({ codingjobPackage }) => {
  const [name, setName] = useState("");
  const [cookies, setCookie] = useCookies(["amcat"]);

  useEffect(() => {
    if (codingjobPackage?.name) setName(codingjobPackage.name);
  }, [codingjobPackage]);

  const deploy = async () => {
    const amcat = newAmcatSession(cookies.amcat.host, cookies.amcat.token);
    try {
      const id = await amcat.postCodingjob(codingjobPackage, name);
      const url = `${amcat.host}/codingjob/${id.data.id}`;
      db.createDeployedJob(name, url);
    } catch (e) {
      console.log(e);
      setCookie("amcat", JSON.stringify({ ...cookies.amcat, token: null }), { path: "/" });
    }
  };

  if (!cookies?.amcat?.token)
    return (
      <LoginForm
        cookies={cookies}
        setCookies={setCookie}
        setOpen={() => null}
        setLoggedIn={() => null}
      />
    );

  return (
    <div>
      <Form onSubmit={() => deploy()}>
        <Form.Input
          placeholder="Codingjob title"
          value={name}
          maxLength={30}
          onChange={(e, d) => setName(d.value)}
          autoFocus
          style={{ width: "100%" }}
        />
      </Form>
      <br />

      <Button fluid primary disabled={name.length < 5} onClick={() => deploy()}>
        {name.length < 5 ? "please use 5 characters or more" : "Upload to AmCAT"}
      </Button>
    </div>
  );
};

const createCoderSets = (codingjobPackage) => {
  const unitSettings = codingjobPackage.provenance.unitSettings;
  const deploySettings = codingjobPackage.provenance.deploySettings;
  const units = codingjobPackage.units.map((u) => u.unit); // remove unit data for backend (like 'gold')

  const nOverlap = Math.round((unitSettings.totalUnits * deploySettings.pctOverlap) / 100);
  //const n = totalSet - overlapSet

  const overlapSet = units.slice(0, nOverlap);
  const unitSet = units.slice(nOverlap);

  let unitSets = Array(Number(deploySettings.nCoders))
    .fill([])
    .map((set) => [...overlapSet]);
  for (let i = 0; i < unitSet.length; i++) {
    unitSets[i % unitSets.length].push(unitSet[i]);
  }

  return unitSets.map((us, i) => ({
    set: i + 1,
    title: codingjobPackage.title,
    codebook: codingjobPackage.codebook,
    units: drawRandom(us, us.length, false, 42, null),
  }));
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
