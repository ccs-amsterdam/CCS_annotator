import React, { useState, useEffect } from "react";
import db from "apis/dexie";
import { useLocation, useHistory } from "react-router";
import { Icon, Grid, Modal, Button } from "semantic-ui-react";
import { useFullScreenHandle } from "react-full-screen";
import FullScreenFix from "./FullScreenFix";

import QuestionTask from "./QuestionTask/QuestionTask";
import AnnotateTask from "./AnnotateTask/AnnotateTask";
import IndexController from "./IndexController";
import { CSVDownloader } from "react-papaparse";

const homepage = "/amcat4annotator";

const Annotator = ({ UnitServer }) => {
  const handle = useFullScreenHandle();
  const [unitIndex, setUnitIndex] = useState(0);
  const [preparedUnit, setPreparedUnit] = useState(null);
  const location = useLocation();

  useEffect(() => {
    if (!UnitServer) return;
    UnitServer.get(unitIndex)
      .then((unit) => {
        setPreparedUnit({
          post: UnitServer.post,
          rules: UnitServer.rules,
          unitId: unit.id,
          ...unit.unit,
        });
      })
      .catch((e) => {
        if (e.response?.status === 404) {
          console.log(
            "404 error. Probably amcat ran out of stuff to give you, but we should handle this differently"
          );
        }
      });
  }, [unitIndex, UnitServer, setPreparedUnit]);

  let maxWidth = "100%";
  let maxHeight = "100%";
  if (UnitServer?.codebook?.type) {
    if (UnitServer?.codebook.type === "questions") [maxWidth, maxHeight] = ["800px", "1000px"];
    if (UnitServer?.codebook.type === "annotate") [maxWidth, maxHeight] = ["2000px", "2000px"];
  }

  const renderTask = () => {
    if (unitIndex === null) return <Finished UnitServer={UnitServer} />;
    return <Task codebook={UnitServer?.codebook} unit={preparedUnit} />;
  };

  return (
    <FullScreenFix handle={handle}>
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
        <AskFullScreenModal location={location} handle={handle} />
        <div style={{ height: "50px", padding: "0", position: "relative" }}>
          <div style={{ width: "85%", paddingLeft: "7.5%" }}>
            <IndexController
              n={UnitServer?.rules.n}
              setIndex={setUnitIndex}
              canGoBack={UnitServer?.rules.canGoBack}
              canGoForward={UnitServer?.rules.canGoForward}
            />
          </div>
          <div>
            <FullScreenButton handle={handle} />
            <ExitButton />
          </div>
        </div>
        <div style={{ height: "calc(100% - 50px)", padding: "0" }}>{renderTask()}</div>
      </div>
    </FullScreenFix>
  );
};

const Finished = ({ UnitServer }) => {
  const [data, setData] = useState(null);

  useEffect(() => {
    if (!UnitServer) return;
    db.listAnnotations(UnitServer.url).then((data) => {
      setData(data);
    });
  }, [UnitServer]);

  if (!UnitServer) return null;

  if (!UnitServer.where === "local")
    return (
      <Grid container centered verticalAlign="middle" style={{ margin: "0", padding: "0" }}>
        <Grid.Row style={{ marginTop: "40vh" }}>
          <div>
            <Icon name="flag checkered" size="huge" style={{ transform: "scale(5)" }} />
          </div>
        </Grid.Row>
      </Grid>
    );

  return (
    <Grid container centered verticalAlign="middle" style={{ margin: "0", padding: "0" }}>
      <Grid.Row style={{ marginTop: "40vh" }}>
        <CSVDownloader filename={`annotations_${UnitServer.url}.json`} data={data}>
          Download
        </CSVDownloader>
      </Grid.Row>
    </Grid>
  );
};

const AskFullScreenModal = ({ location, handle }) => {
  const [askFullscreen, setAskFullscreen] = useState(true);
  useEffect(() => {
    setAskFullscreen(true);
  }, [location, setAskFullscreen]);

  return (
    <Modal open={askFullscreen}>
      <Modal.Header>Fullscreen mode</Modal.Header>
      <Modal.Content>
        <p>
          We recommend working in fullscreen, especially on mobile devices. You can always change
          this with the button in the top-left corner
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
      style={{ padding: "3px", position: "absolute", top: "0px", left: "2px" }}
    >
      <Icon
        link
        name={handle.active ? "compress" : "expand"}
        onClick={() => {
          handle.active ? handle.exit() : handle.enter();
        }}
      />
    </Icon.Group>
  );
};

const ExitButton = () => {
  const history = useHistory();
  return (
    <Icon.Group size="big" style={{ padding: "3px", position: "absolute", top: "0px", right: 0 }}>
      <Icon link name="window close" onClick={() => history.push(homepage + "/manager")} />
      <Icon corner="top right" />
    </Icon.Group>
  );
};

const Task = React.memo(({ codebook, unit }) => {
  if (!codebook || !unit) return null;

  const renderTaskPreview = (type) => {
    switch (type) {
      case "questions":
        return <QuestionTask unit={unit} codebook={codebook} preview={false} />;
      case "annotate":
        return <AnnotateTask unit={unit} codebook={codebook} preview={false} />;
      default:
        return null;
    }
  };

  if (!codebook?.type) return null;
  return renderTaskPreview(codebook.type);
});

export default Annotator;
