import db from "apis/dexie";
import SelectionTable from "components/CodingjobManager/SelectionTable";
import { useLiveQuery } from "dexie-react-hooks";
import objectHash from "object-hash";
import React, { useState, useEffect } from "react";
import { useHistory } from "react-router";
import { Button, Grid, Header, TextArea } from "semantic-ui-react";
import TaskTable from "./TaskTable";
import QRCode from "qrcode.react";

const homepage = "/amcat4annotator";

const TaskSelector = () => {
  const history = useHistory();
  const [taskKey, setTaskKey] = useState(null);

  const uploadFile = (e) => {
    const fileReader = new FileReader();
    fileReader.readAsText(e.target.files[0], "UTF-8");
    fileReader.onload = (e) => {
      const url = "IDB:" + objectHash(e.target.result);
      db.uploadTask(JSON.parse(e.target.result), url, "local");
    };
  };

  const setJobUrlQuery = async () => {
    // set task.url as url query to open job in annotator
    history.push(homepage + "/annotator?" + taskKey.url);
  };

  const linkAndQr = () => {
    if (taskKey == null) return;
    const url = "https://kasperwelbers.com/amcat4annotator/annotator?" + taskKey?.url;
    return (
      <div>
        <TextArea value={url} style={{ width: "512px" }} />
        <QRCode
          value={"This link opens a codingjob in the AmCAT annotator" + encodeURI(url)}
          size={512}
        />
      </div>
    );
  };

  return (
    <Grid centered container>
      <Grid.Row>
        <Grid.Column width={6}>
          {" "}
          <TaskTable taskKey={taskKey} setTaskKey={setTaskKey} />
        </Grid.Column>
        <Grid.Column width={10}>
          <br />
          <br />
          <Header>Upload codingjob</Header>

          <input type="file" onChange={uploadFile} />
          <div>
            <br />

            <Button primary disabled={!taskKey} onClick={setJobUrlQuery}>
              Open selected codingjob
            </Button>
            <br />
            <br />
            {linkAndQr()}
          </div>
        </Grid.Column>
      </Grid.Row>
      <Grid.Row>
        <TaskResults taskKey={taskKey} />
      </Grid.Row>
    </Grid>
  );
};

const columns = [
  {
    Header: "ID",
    accessor: "id",
    headerClass: "one wide",
  },
  {
    Header: "Coder",
    accessor: "coder",
    headerClass: "three wide",
  },
  {
    Header: "Variable",
    accessor: "variable",
    headerClass: "three wide",
  },
  {
    Header: "Value",
    accessor: "value",
    headerClass: "three wide",
  },
];

const TaskResults = ({ taskKey }) => {
  const [annotations, setAnnotations] = useState([]);
  const amcat = useLiveQuery(() => db.amcatSession());

  useEffect(() => {
    if (!taskKey) return null;
    setAnnotations([]);
    getResultUrl(taskKey, amcat, setAnnotations);
  }, [taskKey, amcat, setAnnotations]);

  return <SelectionTable columns={columns} data={annotations} />;
};

const getResultUrl = async (taskKey, amcat, setAnnotations) => {
  let task = await db.idb.tasks.get({ url: taskKey.url });

  if (!task) return;
  if (task.where === "remote") {
    if (!amcat) return;
    const id = taskKey.url.split("codingjob/")[1].split("/codebook")[0];
    const host = taskKey.url.split("codingjob/")[0];
    const url = `${host}/codingjob/${id}`;
    try {
      const res = await amcat.api.get(url);
      console.log(res.data);
      const annotations = res.data.units.reduce((arr, unit, i) => {
        if (unit.annotations) {
          for (let coder of Object.keys(unit.annotations)) {
            for (let ann of unit.annotations[coder]) {
              arr.push({ id: i, coder, ...ann });
            }
          }
        }
        return arr;
      }, []);
      setAnnotations(annotations);
    } catch (e) {
      console.log(e);
      //db.resetAmcatAuth();
    }
  }
};

export default TaskSelector;
