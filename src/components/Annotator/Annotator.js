import React, { useState, useEffect } from "react";
import db from "apis/dexie";
import axios from "axios";
import { useLocation, useHistory } from "react-router";
import { Icon, Grid } from "semantic-ui-react";
import ItemSelector from "components/CodingjobManager/ItemSelector";

import QuestionTask from "./QuestionTask/QuestionTask";
import AnnotateTask from "./AnnotateTask/AnnotateTask";

const Annotator = () => {
  const [task, setTask] = useState(null);
  const [item, setItem] = useState(null);
  const location = useLocation();

  useEffect(() => {
    if (location.search) {
      const jobURL = decodeURI(location.search.substring(1));
      openCodingjob(jobURL, setTask);
    }
  }, [location, setTask]);

  let colWidth = 16;
  if (task?.codebook?.type) {
    if (task.codebook.type === "annotate") colWidth = 16;
    if (task.codebook.type === "questions") colWidth = 8;
  }

  return (
    <Grid container stackable centered style={{ margin: "0", padding: "0" }}>
      <Grid.Row style={{ height: "40px", padding: "0" }}>
        <div width={3}>
          <ItemSelector items={task?.items} setItem={setItem} />
        </div>
        <div width={3}>
          <ExitButton />
        </div>
      </Grid.Row>
      <Grid.Row>
        <Grid.Column width={colWidth} style={{ minHeight: "90vh" }}>
          <Task codebook={task?.codebook} item={item} />
        </Grid.Column>
      </Grid.Row>
    </Grid>
  );
};

const ExitButton = () => {
  const history = useHistory();
  return (
    <Icon.Group size="big" style={{ position: "absolute", top: "0px", right: 0 }}>
      <Icon link name="window close" onClick={() => history.push("/tasks")} />
      <Icon corner="top right" />
    </Icon.Group>
  );
};

const openCodingjob = async (jobURL, setTask) => {
  let task = await db.idb.tasks.get({ url: jobURL });
  if (!task) {
    const response = await axios.get(jobURL);
    const data = response.data;
    await db.idb.tasks.add({
      ...data,
      url: jobURL,
    });
    task = await db.idb.tasks.get(jobURL);
  }
  setTask(task);

  // let job = { name: data.details.name, job_id: hash(data) };
  // job = await db.getCodingjob(job);
  // if (!job) {
  //   await db.createCodingjob(data.details.name, hash(data));
  //   await db.createDocuments(job, data.documents, true);
  //   await db.writeCodebook(job, data.codebook);
  // }
  // const codingjobs = await db.listCodingjobs();
  // const cj = await db.getCodingjob(job);
  // dispatch(selectCodingjob(cj));
  // dispatch(setCodingjobs(codingjobs));
};

const Task = React.memo(({ codebook, item }) => {
  if (!codebook || !item) return null;

  const renderTaskPreview = type => {
    switch (type) {
      case "questions":
        return <QuestionTask item={item} codebook={codebook} preview={false} />;
      case "annotate":
        return <AnnotateTask item={item} codebook={codebook} preview={false} />;
      default:
        return null;
    }
  };

  if (!codebook?.type) return null;
  return renderTaskPreview(codebook.type);
});

export default Annotator;
