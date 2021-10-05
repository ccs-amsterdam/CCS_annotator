import React, { useState } from "react";
import TaskSettings from "./Settings/TaskSettings";
import { Grid, Header } from "semantic-ui-react";
import QuestionTask from "components/Annotator/QuestionTask/QuestionTask";
import AnnotateTask from "components/Annotator/AnnotateTask/AnnotateTask";
import useJobItems from "hooks/useJobItems";
import ItemSelector from "components/CodingjobManager/ItemSelector";
import { standardizeItems } from "util/standardizeItem";
import { useEffect } from "react/cjs/react.development";

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
      <Grid stackable columns={2}>
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
  const [jobItem, setJobItem] = useState(null);
  const [standardizedItem, setStandardizedItem] = useState(null);

  useEffect(() => {
    if (!jobItem) return null;
    standardizeItems(codingjob, [jobItem]).then((singleItemArray) => {
      setStandardizedItem(singleItemArray[0]);
    });
  }, [jobItem, setStandardizedItem, codingjob]);

  if (!jobItems) return null;

  const renderTaskPreview = (type) => {
    switch (type) {
      case "questions":
        return (
          <PreviewQuestionTask codingjob={codingjob} standardizedItem={standardizedItem}>
            <ItemSelector items={jobItems} setItem={setJobItem} />
          </PreviewQuestionTask>
        );
      case "annotate":
        return (
          <PreviewAnnotateTask codingjob={codingjob} standardizedItem={standardizedItem}>
            <ItemSelector items={jobItems} setItem={setJobItem} />
          </PreviewAnnotateTask>
        );
      default:
        return null;
    }
  };

  if (!codingjob?.codebook?.taskSettings?.type) return null;
  return renderTaskPreview(codingjob.codebook.taskSettings.type);
});

const PreviewQuestionTask = React.memo(({ children, codingjob, standardizedItem }) => {
  return (
    <>
      <Header
        textAlign="center"
        style={{ maxWidth: "400px", background: "#1B1C1D", color: "white" }}
      >
        Preview
        {children}
      </Header>

      <div
        style={{
          padding: "0",
          maxWidth: "400px",
          height: "calc(100vh - 250px)",
          minHeight: "300px",

          maxHeight: "800px",
        }}
      >
        <div style={{ padding: "0em", paddingTop: "1em", height: "100%" }}>
          <QuestionTask item={standardizedItem} codebook={codingjob.codebook} preview={true} />
        </div>
      </div>
    </>
  );
});

const PreviewAnnotateTask = ({ children, codingjob, standardizedItem }) => {
  return (
    <>
      <Header textAlign="center" style={{ background: "#1B1C1D", color: "white" }}>
        Preview
      </Header>
      {children}

      <div
        style={{
          padding: "0",
          width: "100%",
          height: "calc(100vh - 250px)",
          minHeight: "300px",
        }}
      >
        <div style={{ padding: "0", height: "100%" }}>
          <AnnotateTask item={standardizedItem} codebook={codingjob.codebook} preview={true} />
        </div>
      </div>
    </>
  );
};

export default React.memo(ManageTask);
