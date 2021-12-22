import React, { useState, useEffect } from "react";
import { useLocation } from "react-router";
import { Icon, Grid, Modal, Button, Header } from "semantic-ui-react";
import { useFullScreenHandle } from "react-full-screen";

import DownloadAnnotations from "./subcomponents/DownloadAnnotations";

import FullScreenFix from "./subcomponents/FullScreenFix";
import IndexController from "./subcomponents/IndexController";

import QuestionTask from "components/Annotator/QuestionTask";
import AnnotateTask from "components/Annotator/AnnotateTask";

const AnnotatorScreen = ({ jobServer }) => {
  const fsHandle = useFullScreenHandle();
  const [unitIndex, setUnitIndex] = useState(0);
  const [preparedUnit, setPreparedUnit] = useState(null);
  const location = useLocation();

  useEffect(() => {
    setUnitIndex(jobServer.progress.n_coded);
  }, [jobServer, setUnitIndex]);

  useEffect(() => {
    if (!jobServer) return;
    jobServer
      .getUnit(unitIndex)
      .then((unit) => {
        console.log(unit);
        setPreparedUnit({
          jobServer,
          unitId: unit.id,
          ...unit.unit,
          annotations: unit.annotation,
          status: unit.status,
        });
      })
      .catch((e) => {
        if (e.response?.status === 404) setUnitIndex(null);
        setPreparedUnit(null);
        console.log(e);
      });
  }, [unitIndex, jobServer, setUnitIndex, setPreparedUnit]);

  let maxWidth = "100%";
  let maxHeight = "100%";
  if (jobServer?.codebook?.type) {
    if (jobServer?.codebook.type === "questions") [maxWidth, maxHeight] = ["800px", "1000px"];
    if (jobServer?.codebook.type === "annotate") [maxWidth, maxHeight] = ["2000px", "2000px"];
  }

  const renderTask = () => {
    if (unitIndex === null) return <Finished jobServer={jobServer} />;
    return <Task codebook={jobServer?.codebook} unit={preparedUnit} setUnitIndex={setUnitIndex} />;
  };

  return (
    <FullScreenFix handle={fsHandle}>
      <div
        style={{
          maxWidth,
          maxHeight,
          background: "white",
          margin: "0 auto",
          padding: "0",
          height: "100vh",
          border: "1px solid white",
        }}
      >
        <AskFullScreenModal location={location} handle={fsHandle} />
        <div style={{ height: "45px", padding: "0", position: "relative" }}>
          <div style={{ width: "85%", paddingLeft: "7.5%" }}>
            <IndexController
              n={jobServer?.progress.n_total}
              index={unitIndex}
              setIndex={setUnitIndex}
              canGoBack={jobServer?.progress.seek_backwards}
              canGoForward={jobServer?.progress.seek_forwards}
              quickKeyNext={jobServer?.codebook?.type === "annotate"}
            />
          </div>
          <div>
            <FullScreenButton handle={fsHandle} />
            {/* <BackButton /> */}
          </div>
        </div>
        <div style={{ height: "calc(100% - 45px)", padding: "0" }}>{renderTask()}</div>
      </div>
    </FullScreenFix>
  );
};

const Finished = ({ jobServer }) => {
  if (!jobServer) return null;

  if (jobServer.where === "remote") {
    return (
      <Grid container centered verticalAlign="middle" style={{ margin: "0", padding: "0" }}>
        <Grid.Row style={{ marginTop: "40vh" }}>
          <div>
            <Icon name="flag checkered" size="huge" style={{ transform: "scale(5)" }} />
          </div>
        </Grid.Row>
      </Grid>
    );
  } else {
    return (
      <Grid container centered verticalAlign="middle" style={{ margin: "0", padding: "0" }}>
        <Grid.Row style={{ marginTop: "40vh" }}>
          <Grid.Column width={4}>
            <Icon name="flag checkered" size="huge" style={{ transform: "scale(1)" }} />
          </Grid.Column>
          <Grid.Column width={8}>
            <Header>You finished the codingjob!</Header>
            <p>Please download your results and send them to whoever gave you this job. </p>
            <DownloadAnnotations localJobServer={jobServer} />
          </Grid.Column>
        </Grid.Row>
      </Grid>
    );
  }
};

const AskFullScreenModal = ({ location, handle }) => {
  let [askFullscreen, setAskFullscreen] = useState(true);
  useEffect(() => {
    setAskFullscreen(true);
  }, [location, setAskFullscreen]);

  // Disable for now. Seems to not work in Apple devices
  //askFullscreen = false;

  return (
    <Modal open={askFullscreen}>
      <Modal.Header>Fullscreen mode</Modal.Header>
      <Modal.Content>
        <p>
          We recommend working in fullscreen, especially on mobile devices. You can always change
          this with the button in the top-right corner. For some devices fullscreen might not work.
        </p>
        <div style={{ display: "flex", height: "30vh" }}>
          <Button
            primary
            size="massive"
            onClick={() => {
              if (!handle.active) handle.enter();
              setAskFullscreen(false);
            }}
            style={{ flex: "1 1 auto" }}
          >
            Fullscreen
          </Button>
          <Button
            secondary
            size="massive"
            onClick={() => {
              if (handle.active) handle.exit();
              setAskFullscreen(false);
            }}
            style={{ flex: "1 1 auto" }}
          >
            Windowed
          </Button>
        </div>
      </Modal.Content>
    </Modal>
  );
};

const FullScreenButton = ({ handle }) => {
  return (
    <Icon.Group
      size="big"
      style={{ paddingRight: "3px", position: "absolute", top: "0px", right: 0 }}
    >
      <Icon
        link
        name={handle.active ? "window close" : "expand"}
        onClick={() => {
          handle.active ? handle.exit() : handle.enter();
        }}
      />
    </Icon.Group>
  );
};

// const BackButton = () => {
//   // pretty useless, given that every browser has one
//   const history = useHistory();
//   return (
//     <Icon.Group size="big" style={{ padding: "3px", position: "absolute", top: "0px", right: 0 }}>
//       <Icon link name="window close" onClick={() => history.goBack()} />
//       <Icon corner="top right" />
//     </Icon.Group>
//   );
// };

const Task = ({ codebook, unit, setUnitIndex }) => {
  if (!codebook || !unit) return null;

  const renderTaskPreview = (type) => {
    switch (type) {
      case "questions":
        return <QuestionTask unit={unit} codebook={codebook} setUnitIndex={setUnitIndex} />;
      case "annotate":
        return <AnnotateTask unit={unit} codebook={codebook} setUnitIndex={setUnitIndex} />;
      default:
        return null;
    }
  };

  if (!codebook?.type) return null;
  return renderTaskPreview(codebook.type);
};

export default AnnotatorScreen;
