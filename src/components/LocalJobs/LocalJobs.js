import db from "apis/dexie";
import objectHash from "object-hash";
import React, { useState } from "react";
import { useHistory } from "react-router";
import { Button, Grid, Header } from "semantic-ui-react";
import TaskTable from "./LocalJobTable";
import JSZip from "jszip";

const LocalJobs = () => {
  const history = useHistory();
  const [jobKey, setJobKey] = useState(null);

  const uploadFile = async (e) => {
    const fileReader = new FileReader();
    const fileblob = e.target.files[0];
    const type = getExtension(fileblob.name);

    if (type === "json") {
      fileReader.readAsText(fileblob, "UTF-8");
      fileReader.onload = (e) => {
        const id = objectHash(e.target.result);
        db.createLocalJob(JSON.parse(e.target.result), id);
      };
    }
    if (type === "zip") {
      console.log("test");
      let newZip = new JSZip();
      const zipped = await newZip.loadAsync(fileblob);
      zipped.forEach(async (relpath, file) => {
        if (file.name.slice(0, 3) !== "set") return;
        const content = await zipped.file(file.name).async("text");
        const id = objectHash(content);
        db.createLocalJob(JSON.parse(content), id);
      });
    }
  };

  const setJobUrlQuery = async () => {
    // set task.url as url query to open job in annotator
    history.push("/annotator?id=" + jobKey.id);
  };

  return (
    <Grid centered stackable container style={{ marginTop: "5em" }}>
      <Grid.Column style={{ textAlign: "center" }} width={8}>
        <Header textAlign="center" style={{ background: "#1B1C1D", color: "white" }}>
          Read codingjob
        </Header>

        <input type="file" accept=".json,.zip" onChange={uploadFile} />
        <div>
          <br />
        </div>
      </Grid.Column>
      <Grid.Column width={8}>
        <Header textAlign="center" style={{ background: "#1B1C1D", color: "white" }}>
          Your codingjobs
        </Header>
        <Button fluid primary disabled={!jobKey} onClick={setJobUrlQuery}>
          Open selected codingjob
        </Button>
        <br />
        <br />
        <TaskTable jobKey={jobKey} setJobKey={setJobKey} />
      </Grid.Column>
    </Grid>
  );
};

const getExtension = (filename) => {
  const parts = filename.split(".");
  return parts[parts.length - 1];
};

export default LocalJobs;
