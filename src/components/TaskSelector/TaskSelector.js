import React, { useEffect, useState } from "react";

import db from "apis/dexie";
import { useHistory } from "react-router";
import { useLiveQuery } from "dexie-react-hooks";
import { Grid, Header, Button } from "semantic-ui-react";
import objectHash from "object-hash";
import SelectionTable from "components/CodingjobManager/SelectionTable";

const tableColumns = [
  {
    Header: "Title",
    accessor: "title",
    headerClass: "two wide",
  },
  {
    Header: "URL",
    accessor: "url",
    headerClass: "four wide",
  },
];

const TaskSelector = () => {
  const history = useHistory();

  const tasks = useLiveQuery(async () => {
    let arr = await db.idb.tasks.orderBy("last_modified").primaryKeys();
    arr = arr.map(a => ({ title: a[0], url: a[1] }));
    //if (arr) arr.sort((a, b) => b.last_modified - a.last_modified);
    return arr;
  });
  const [taskKey, setTaskKey] = useState(null);

  useEffect(() => {
    if (!taskKey && tasks) {
      setTaskKey(tasks.length > 0 ? { ...tasks[0], ROW_ID: "0" } : null);
    }
  }, [taskKey, tasks, setTaskKey]);

  const uploadFile = e => {
    const fileReader = new FileReader();
    fileReader.readAsText(e.target.files[0], "UTF-8");
    fileReader.onload = e => {
      uploadTask(JSON.parse(e.target.result));
    };
  };

  const setJobUrlQuery = async () => {
    // set task.url as url query to open job in annotator
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

const uploadTask = async codingjobPackage => {
  const url = "IDB:" + objectHash(codingjobPackage);
  const exists = await db.idb.tasks.get({ url });
  if (!exists) {
    db.idb.tasks.add({
      url,
      last_modified: new Date(),
      medium: "file",
      ...codingjobPackage,
    });
  } else {
    alert("This job has already been created before");
  }
};

export default TaskSelector;
