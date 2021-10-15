import React, { useState, useEffect } from "react";
import DeploySettings from "./Settings/DeploySettings";
import useUnits from "hooks/useUnits";
import { Grid, Header, Button, Form } from "semantic-ui-react";
import fileDownload from "js-file-download";
import objectHash from "object-hash";

import db from "apis/dexie";
import { standardizeUnits } from "util/standardizeUnits";
import { getCodebook } from "util/codebook";
import { useLiveQuery } from "dexie-react-hooks";
import TaskSelector from "components/TaskSelector/TaskSelector";

const DeployCodingjob = ({ codingjob }) => {
  const [codingjobPackage, setCodingjobPackage] = useState(null);
  const units = useUnits(codingjob);

  useEffect(() => {
    if (!units || units.length === 0) return;
    if (!codingjob?.unitSettings || !codingjob?.taskSettings) return;
    createCodingjobPackage(codingjob, units, setCodingjobPackage);
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

  if (!codingjob) return null;

  return (
    <div>
      <Grid centered stackable columns={2}>
        <Grid.Column width={4}>
          <Header textAlign="center" style={{ background: "#1B1C1D", color: "white" }}>
            Deploy Codingjob
          </Header>
          <DeploySettings codingjob={codingjob} />
          <br />
          {deployButton(codingjob?.deploySettings?.medium)}
        </Grid.Column>
        <Grid.Column width={8}>
          <Header textAlign="center" style={{ background: "#1B1C1D", color: "white" }}>
            Previously deployed jobs
          </Header>
          <TaskSelector />
        </Grid.Column>
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
    codingjobPackage.title = title;
    const json = [JSON.stringify(codingjobPackage)];
    const blob = new Blob(json, { type: "text/plain;charset=utf-8" });

    try {
      fileDownload(blob, `AmCAT_annotator_${codingjobPackage.title}.json`);
      const url = objectHash(codingjobPackage);
      db.uploadTask(codingjobPackage, url, "local");
    } catch (error) {
      console.error("" + error);
    }
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
        {title.length < 5 ? "please use 5 characters or more" : "Download codingjob"}{" "}
      </Button>
    </div>
  );
};

const AmcatDeploy = ({ codingjobPackage }) => {
  const [title, setTitle] = useState("");
  const amcat = useLiveQuery(() => db.amcatSession());

  useEffect(() => {
    if (codingjobPackage?.title) setTitle(codingjobPackage.title);
  }, [codingjobPackage]);

  const deploy = async () => {
    try {
      const id = await amcat.postCodingjob(codingjobPackage, title);
      const url = `${amcat.host}/codingjob/${id.data.id}`;
      db.uploadTask({ title, amcat: { host: amcat.host, username: amcat.user } }, url, "remote");
    } catch (e) {
      console.log(e);
      db.resetAmcatAuth();
    }
  };

  if (!amcat) return <p>You need to log in to AmCAT first. (see top-right in the menu)</p>;

  return (
    <div>
      <Form onSubmit={() => deploy()}>
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

      <Button fluid primary disabled={title.length < 5} onClick={() => deploy()}>
        {title.length < 5 ? "please use 5 characters or more" : "Upload to AmCAT"}
      </Button>
    </div>
  );
};

const createCodingjobPackage = async (codingjob, units, setCodingjobPackage) => {
  const cjpackage = {
    title: codingjob.name,
    provenance: { unitSettings: codingjob.unitSettings },
    codebook: getCodebook(codingjob.taskSettings),
    units: await standardizeUnits(codingjob, units),
    rules: {},
    annotations: [],
  };

  setCodingjobPackage(cjpackage);
};

export default DeployCodingjob;
