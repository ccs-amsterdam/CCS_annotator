import React, { useState } from "react";
import TaskSettings from "./Settings/TaskSettings";
import { Grid, Header } from "semantic-ui-react";
import QuestionTask from "components/Annotator/QuestionTask/QuestionTask";
import AnnotateTask from "components/Annotator/AnnotateTask/AnnotateTask";
import useJobItems from "hooks/useJobItems";
import ItemSelector from "components/CodingjobManager/ItemSelector";

const ManageTask = ({ codingjob }) => {
  // When a new codingjob is loaded, set codingjobLoaded ref to false
  // this prevents actually loading the data until unitSettings has loaded
  // the unitSettings stored in the codingjob
  const jobItems = useJobItems(codingjob);

  if (!codingjob) return null;
  let cwidths = [8, 8];
  if (codingjob.codebook?.taskSettings?.type) {
    if (codingjob.codebook.taskSettings.type === "annotate") cwidths = [4, 12];
    if (codingjob.codebook.taskSettings.type === "questions") cwidths = [6, 6];
  }

  return (
    <div>
      <Grid columns={2}>
        <Grid.Column verticalAlign="top" stretched width={cwidths[0]}>
          <Header textAlign="center" style={{ background: "#1B1C1D", color: "white" }}>
            Settings
          </Header>
          <TaskSettings codingjob={codingjob} />
        </Grid.Column>
        <Grid.Column center width={cwidths[1]}>
          <PreviewTask codingjob={codingjob} jobItems={jobItems} />
        </Grid.Column>
      </Grid>
    </div>
  );
};

const PreviewTask = React.memo(({ codingjob, jobItems }) => {
  if (!jobItems) return null;

  const renderTaskPreview = type => {
    switch (type) {
      case "questions":
        return <PreviewQuestionTask codingjob={codingjob} jobItems={jobItems} />;
      case "annotate":
        return <PreviewAnnotateTask codingjob={codingjob} jobItems={jobItems} />;
      default:
        return null;
    }
  };

  if (!codingjob?.codebook?.taskSettings?.type) return null;
  return renderTaskPreview(codingjob.codebook.taskSettings.type);
});

const PreviewQuestionTask = React.memo(({ codingjob, jobItems }) => {
  const [jobItem, setJobItem] = useState(null);

  return (
    <>
      <Header textAlign="center" style={{ width: "400px", background: "#1B1C1D", color: "white" }}>
        Preview
        <ItemSelector items={jobItems} setItem={setJobItem} />
      </Header>

      <div
        style={{
          padding: "0",
          width: "400px",
          height: "calc(100vh - 250px)",
        }}
      >
        <div style={{ padding: "0em", paddingTop: "1em", height: "100%", border: "1px solid" }}>
          <QuestionTask item={jobItem} codebook={codingjob.codebook} preview={true} />
        </div>
      </div>
    </>
  );
});

const PreviewAnnotateTask = ({ codingjob, jobItems }) => {
  const [jobItem, setJobItem] = useState(null);

  return (
    <>
      <Header textAlign="center" style={{ background: "#1B1C1D", color: "white" }}>
        Preview
      </Header>
      <ItemSelector items={jobItems} setItem={setJobItem} />

      <div
        style={{
          padding: "0",
          width: "100%",
          height: "calc(100vh - 250px)",
        }}
      >
        <div style={{ padding: "0", height: "100%", border: "1px solid" }}>
          <AnnotateTask item={jobItem} codebook={codingjob.codebook} preview={true} />
        </div>
      </div>
    </>
  );
};

export default React.memo(ManageTask);
