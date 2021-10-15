import React, { useState, useEffect } from "react";
import TaskSettings from "./Settings/TaskSettings";
import { Grid, Header } from "semantic-ui-react";
import QuestionTask from "components/Annotator/QuestionTask/QuestionTask";
import AnnotateTask from "components/Annotator/AnnotateTask/AnnotateTask";
import useUnits from "hooks/useUnits";
import { standardizeUnits } from "util/standardizeUnits";
import { getCodebook } from "util/codebook";
import IndexController from "components/Annotator/IndexController";
import { useDispatch } from "react-redux";
import { blockEvents } from "actions";

const ManageTask = ({ codingjob }) => {
  // When a new codingjob is loaded, set codingjobLoaded ref to false
  // this prevents actually loading the data until unitSettings has loaded
  // the unitSettings stored in the codingjob
  const units = useUnits(codingjob);

  if (!codingjob) return null;
  let cwidths = [8, 8];
  if (codingjob.taskSettings?.type) {
    if (codingjob.taskSettings.type === "annotate") cwidths = [4, 12];
    if (codingjob.taskSettings.type === "questions") cwidths = [6, 6];
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
        <Grid.Column width={cwidths[1]}>
          <PreviewTask codingjob={codingjob} units={units} />
        </Grid.Column>
      </Grid>
    </div>
  );
};

const PreviewTask = React.memo(({ codingjob, units }) => {
  const [index, setIndex] = useState(null);
  const [standardizedUnit, setStandardizedUnit] = useState(null);
  const [codebook, setCodebook] = useState(null);

  useEffect(() => {
    if (!codingjob?.taskSettings) return;
    setCodebook(getCodebook(codingjob.taskSettings));
  }, [codingjob.taskSettings]);

  useEffect(() => {
    if (!units || index === null) {
      setStandardizedUnit(null);
      return null;
    }
    if (index >= units.length) return null;
    standardizeUnits(codingjob, [units[index]]).then((singleUnitArray) => {
      const previewUnit = singleUnitArray[0];
      previewUnit.post = (annotations) => console.log(annotations); // don't store annotations
      previewUnit.rules = { canGoBack: true, canGoForward: true };
      setStandardizedUnit(previewUnit);
    });
  }, [index, units, setStandardizedUnit, codingjob]);

  if (!units) return null;

  const renderTaskPreview = (type) => {
    switch (type) {
      case "questions":
        return (
          <PreviewQuestionTask codebook={codebook} standardizedUnit={standardizedUnit}>
            <IndexController n={units?.length} setIndex={setIndex} />
          </PreviewQuestionTask>
        );
      case "annotate":
        return (
          <PreviewAnnotateTask codebook={codebook} standardizedUnit={standardizedUnit}>
            <IndexController n={units?.length} setIndex={setIndex} />
          </PreviewAnnotateTask>
        );
      default:
        return null;
    }
  };

  if (!codingjob?.taskSettings?.type) return null;
  return renderTaskPreview(codingjob.taskSettings.type);
});

const PreviewQuestionTask = React.memo(({ children, codebook, standardizedUnit }) => {
  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(blockEvents(true));
    return () => {
      dispatch(blockEvents(false));
    };
  });

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
          minHeight: "500px",

          maxHeight: "800px",
        }}
      >
        <div style={{ padding: "0em", paddingTop: "1em", height: "100%" }}>
          <QuestionTask unit={standardizedUnit} codebook={codebook} preview={true} />
        </div>
      </div>
    </>
  );
});

const PreviewAnnotateTask = ({ children, codebook, standardizedUnit }) => {
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
          <AnnotateTask unit={standardizedUnit} codebook={codebook} preview={true} />
        </div>
      </div>
    </>
  );
};

export default React.memo(ManageTask);
