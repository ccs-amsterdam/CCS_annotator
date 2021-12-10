import React, { useState, useEffect } from "react";
import TaskSettings from "./subcomponents/TaskSettings";
import { Grid, Header } from "semantic-ui-react";
import useUnits from "components/CodingjobManager/subcomponents/useUnits";
import { standardizeUnits } from "library/standardizeUnits";
import { getCodebook } from "library/codebook";
import { useSelector } from "react-redux";

// imported from annotator
import IndexController from "components/Annotator/subcomponents/IndexController";
import AnnotateTask from "components/Annotator/AnnotateTask";
import QuestionTask from "components/Annotator/QuestionTask";

const ManageTask = ({ codingjob }) => {
  // When a new codingjob is loaded, set codingjobLoaded ref to false
  // this prevents actually loading the data until unitSettings has loaded
  // the unitSettings stored in the codingjob
  const [units] = useUnits(codingjob);

  if (!codingjob) return null;
  let cwidths = [8, 8];
  if (codingjob.taskSettings?.type) {
    if (codingjob.taskSettings.type === "annotate") cwidths = [6, 10];
    if (codingjob.taskSettings.type === "questions") cwidths = [8, 8];
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
      previewUnit.jobServer = { postAnnotations: (unit_id, data) => console.log(unit_id, data) }; // don't store annotations
      previewUnit.rules = { canGoBack: true, canGoForward: true };
      setStandardizedUnit(previewUnit);
    });
  }, [index, units, setStandardizedUnit, codingjob]);

  if (!units) return null;

  const renderTaskPreview = (type) => {
    switch (type) {
      case "questions":
        return (
          <PreviewQuestionTask
            codebook={codebook}
            standardizedUnit={standardizedUnit}
            setUnitIndex={setIndex}
          >
            <IndexController n={units?.length} index={index} setIndex={setIndex} />
          </PreviewQuestionTask>
        );
      case "annotate":
        return (
          <PreviewAnnotateTask
            codebook={codebook}
            standardizedUnit={standardizedUnit}
            setUnitIndex={setIndex}
          >
            <IndexController n={units?.length} index={index} setIndex={setIndex} />
          </PreviewAnnotateTask>
        );
      default:
        return null;
    }
  };

  if (!codingjob?.taskSettings?.type) return null;
  return renderTaskPreview(codingjob.taskSettings.type);
});

const PreviewQuestionTask = React.memo(({ children, codebook, standardizedUnit, setUnitIndex }) => {
  if (!codebook) return null;
  if (!codebook?.type === "questions") return null;

  return (
    <>
      <Header textAlign="center" style={{ background: "#1B1C1D", color: "white", height: "40px" }}>
        Preview
        {children}
      </Header>

      <div
        style={{
          padding: "0",
          display: "flex",
          justifyContent: "center",
          height: "calc(100vh - 250px)",
          minHeight: "500px",
          maxHeight: "800px",
        }}
      >
        <div
          style={{
            padding: "0em",
            width: "70%",
            paddingTop: "1em",
            height: "100%",
          }}
        >
          <QuestionTask
            unit={standardizedUnit}
            codebook={codebook}
            setUnitIndex={setUnitIndex}
            blockEvents={true}
          />
        </div>
      </div>
    </>
  );
});

const PreviewAnnotateTask = ({ children, codebook, standardizedUnit, setUnitIndex }) => {
  const blockEvents = useSelector((state) => state.eventsBlocked);
  if (!codebook) return null;
  if (codebook.type !== "annotate") return null;

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
          minHeight: "500px",
        }}
      >
        <div style={{ padding: "0", height: "100%" }}>
          <AnnotateTask
            unit={standardizedUnit}
            codebook={codebook}
            setUnitIndex={setUnitIndex}
            blockEvents={blockEvents}
          />
        </div>
      </div>
    </>
  );
};

export default React.memo(ManageTask);
