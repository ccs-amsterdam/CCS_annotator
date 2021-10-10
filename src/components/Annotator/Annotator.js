import React, { useState, useEffect } from "react";
import db from "apis/dexie";
import axios from "axios";
import { useLocation, useHistory } from "react-router";
import { Icon, Grid } from "semantic-ui-react";
import { FullScreen, useFullScreenHandle } from "react-full-screen";

import QuestionTask from "./QuestionTask/QuestionTask";
import AnnotateTask from "./AnnotateTask/AnnotateTask";
import IndexController from "./IndexController";

const homepage = "/amcat4annotator";

const Annotator = () => {
  const handle = useFullScreenHandle();
  const [task, setTask] = useState(null);
  const [unitIndex, setUnitIndex] = useState(null);
  const [preparedItem, setPreparedItem] = useState(null);
  const [finished, setFinished] = useState(false);
  const location = useLocation();

  useEffect(() => {
    if (location.search) {
      const jobURL = decodeURI(location.search.substring(1));
      prepareTask(jobURL, setTask);
    }
  }, [location, setTask]);

  useEffect(() => {
    if (!task) return;
    task.server
      .get(unitIndex)
      .then(unit => {
        setPreparedItem({ post: task.server.post, unitId: unit.data.id, ...unit.data.unit });
      })
      .catch(e => {
        if (e.response?.status === 404) setFinished(true);
      });
  }, [unitIndex, task, setPreparedItem]);

  let colWidth = 16;
  if (task?.codebook?.type) {
    if (task.codebook.type === "annotate") colWidth = 16;
    if (task.codebook.type === "questions") colWidth = 8;
  }

  if (finished) return <Finished />;

  return (
    <FullScreen handle={handle}>
      <Grid
        container
        stackable
        centered
        style={{ background: "white", margin: "0", padding: "0", height: "100vh" }}
      >
        <Grid.Row style={{ height: "35px", padding: "0" }}>
          <div>
            <IndexController
              n={task?.units?.length}
              setIndex={setUnitIndex}
              canControl={task?.unitMode === "list"}
              setFinished={setFinished}
            />
          </div>
          <div>
            <FullScreenButton handle={handle} />
            <ExitButton />
          </div>
        </Grid.Row>
        <Grid.Row style={{ height: "calc(100% - 35px)" }}>
          <Grid.Column width={colWidth} style={{ height: "100%" }}>
            <Task codebook={task?.codebook} item={preparedItem}></Task>
          </Grid.Column>
        </Grid.Row>
      </Grid>
    </FullScreen>
  );
};

const Finished = () => {
  return (
    <Grid container centered verticalAlign="middle" style={{ margin: "0", padding: "0" }}>
      <Grid.Row style={{ height: "40px", padding: "0" }}>
        <div width={3}>
          <ExitButton />
        </div>
      </Grid.Row>
      <Grid.Row style={{ marginTop: "40vh" }}>
        <div>
          <Icon name="flag checkered" size="huge" style={{ transform: "scale(5)" }} />
        </div>
      </Grid.Row>
    </Grid>
  );
};

const ExitButton = () => {
  const history = useHistory();
  return (
    <Icon.Group size="big" style={{ position: "absolute", top: "0px", right: 0 }}>
      <Icon link name="window close" onClick={() => history.push(homepage + "/manager")} />
      <Icon corner="top right" />
    </Icon.Group>
  );
};

const FullScreenButton = ({ handle }) => {
  return (
    <Icon.Group size="big" style={{ position: "absolute", top: "0px", left: "2px" }}>
      <Icon
        link
        name={handle.active ? "compress" : "expand"}
        onClick={() => {
          console.log(handle);
          handle.active ? handle.exit() : handle.enter();
        }}
      />
      <Icon corner="top left" />
    </Icon.Group>
  );
};

const prepareTask = async (jobURL, setTask) => {
  let task = await db.idb.tasks.get({ url: jobURL });

  // make this two steps:
  // if task does not exist, retrieve it, and add to db
  // In time, retrieved task can itself say type is local or remote, but for now assume it's always remote

  // second step is to prepare the task for either local or remote
  // preparedTask should have its own get and post functions
  // get should take an item index as input (even if it doesn't use it).
  // post should take the unit_id and data as input.

  // !! make task a proper class
  console.log(task);

  if (task && task.where === "local") {
    task.unitMode = "list";
    const get = async i => ({ data: { id: i, unit: task.units[i] } });
    const post = async (unit_id, data) => console.log("here function to write to db");
    task.server = { get, post };
  } else {
    const user = await db.idb.user.get(1);
    const response = await axios.get(jobURL);

    // works if url always has this structure. Otherwise maybe include id in codebook
    const id = jobURL.split("codingjob/")[1].split("/codebook")[0];
    const host = jobURL.split("codingjob/")[0];
    const get = async i => axios.get(`${host}/codingjob/${id}/unit?user=${user.name}`);
    const post = async (unit_id, data) =>
      axios.post(`${host}/codingjob/${id}/unit/${unit_id}/annotation?user=${user.name}`, data);

    // this is just a temp hack. need to make itemselector smarter
    const units_range = [];
    for (let i = 1; i <= 20; i++) units_range.push(i);

    task = {
      codebook: response.data,
      units: units_range,
      unitMode: "perUnit",
      server: { get, post },
    };
  }
  setTask(task);
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
