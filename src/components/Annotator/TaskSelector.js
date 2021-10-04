import React, { useEffect, useState } from "react";

import axios from "axios";
import hash from "object-hash";

import db from "apis/dexie";
import { useHistory, useLocation } from "react-router";
import { selectCodingjob, setCodingjobs } from "actions";
import { useLiveQuery } from "dexie-react-hooks";
import { Grid, Header, Button } from "semantic-ui-react";

import SelectionTable from "components/CodingjobManager/SelectionTable";

const tableColumns = [
  {
    Header: "URL",
    accessor: "url",
    headerClass: "two wide",
  },
  {
    Header: "Last modified",
    accessor: "last_modified",
    headerClass: "four wide",
  },
];

const TaskSelector = () => {
  const history = useHistory();

  const tasks = useLiveQuery(async () => {
    let arr = await db.idb.tasks.toCollection().primaryKeys();
    arr = arr.map((a) => ({ url: a[0], last_modified: a[1] }));
    if (arr) arr.sort((a, b) => b.last_modified - a.last_modified);
    return arr;
  });
  const [taskKey, setTaskKey] = useState(null);

  useEffect(() => {
    if (!taskKey && tasks) {
      setTaskKey(tasks.length > 0 ? { ...tasks[0], ROW_ID: "0" } : null);
    }
  }, [taskKey, tasks, setTaskKey]);

  const uploadFile = (e) => {
    const fileReader = new FileReader();
    const url = e.target.files[0].name;
    fileReader.readAsText(e.target.files[0], "UTF-8");
    fileReader.onload = (e) => {
      uploadTask(JSON.parse(e.target.result), url);
    };
  };

  const setJobUrlQuery = () => {
    // set task.url as url query to open job
    // (this keeps it consistent with reading jobs from urls)
    history.push("/annotator?" + taskKey.url);
  };

  //if (task) return <

  return (
    <Grid centered container>
      <Grid.Column width={6}>
        {" "}
        <Header textAlign="center" style={{ background: "#1B1C1D", color: "white" }}>
          Recent coding jobs
        </Header>
        <SelectionTable
          columns={tableColumns}
          data={tasks ? tasks : []}
          selectedRow={taskKey}
          setSelectedRow={setTaskKey}
          defaultSize={15}
        />
      </Grid.Column>
      <Grid.Column width={3}>
        <br />
        <br />
        <Header>Upload codingjob</Header>

        <input type="file" onChange={uploadFile} />
        <div>
          <br />
          <Button primary disabled={!taskKey} onClick={setJobUrlQuery}>
            Open selected codingjob
          </Button>
        </div>
      </Grid.Column>
    </Grid>
  );
};

const uploadTask = async (codingjobPackage, url) => {
  const exists = await db.idb.tasks.get(url);
  if (!exists) {
    db.idb.tasks.add({
      url,
      last_modified: codingjobPackage.last_modified,
      name: codingjobPackage.name,
      codebook: codingjobPackage.codebook,
      items: codingjobPackage.items,
    });
  } else {
    alert("This job has already been created before");
  }
};

export default TaskSelector;
