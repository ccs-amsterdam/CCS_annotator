import React, { useState, useEffect } from "react";
import { Icon, Grid, Header } from "semantic-ui-react";
import DownloadAnnotations from "./subcomponents/DownloadAnnotations";
import IndexController from "./subcomponents/IndexController";
import Task from "./subcomponents/Task";
import FullScreenWindow from "./subcomponents/FullScreenWindow";
import "components/Annotator/annotatorStyle.css";

/**
 * Render an annotator for the provided jobServer class
 *
 * @param {*} jobServer  A jobServer class
 */
const Annotator = ({ jobServer }) => {
  const [unitIndex, setUnitIndex] = useState(-1);
  const [preparedUnit, setPreparedUnit] = useState(null);

  useEffect(() => {
    // on start (or jobserver changes), unitIndex based on progress
    setUnitIndex(jobServer.progress.n_coded);
  }, [jobServer, setUnitIndex]);

  useEffect(() => {
    // When unitIndex changes, get the unit
    if (!jobServer) return;
    getUnit(jobServer, unitIndex, setPreparedUnit, setUnitIndex);
  }, [unitIndex, jobServer, setUnitIndex, setPreparedUnit]);

  const content = (fullScreenNode) => {
    if (unitIndex < 0) return null;
    if (unitIndex === null) return <Finished jobServer={jobServer} />;
    return <Task unit={preparedUnit} setUnitIndex={setUnitIndex} fullScreenNode={fullScreenNode} />;
  };

  const [maxHeight, maxWidth] = getWindowSize(jobServer);

  return (
    <FullScreenWindow>
      {(fullScreenNode, fullScreenButton) => (
        // FullScreenWindow passes on the fullScreenNode needed to mount popups, and a fullScreenButton to handle on/off
        <div
          style={{
            maxWidth,
            maxHeight,
            background: "white",
            margin: "0 auto",
            padding: "0",
            height: "100%",
            border: "1px solid white",
          }}
        >
          <div style={{ height: "45px", padding: "0", position: "relative" }}>
            <div style={{ width: "85%", paddingLeft: "7.5%" }}>
              <IndexController
                n={jobServer?.progress.n_total}
                index={unitIndex}
                setIndex={setUnitIndex}
                canGoBack={jobServer?.progress.seek_backwards}
                canGoForward={jobServer?.progress.seek_forwards}
              />
            </div>
            <div>{fullScreenButton}</div>
          </div>
          <div style={{ height: "calc(100% - 45px)", padding: "0" }}>{content(fullScreenNode)}</div>
        </div>
      )}
    </FullScreenWindow>
  );
};

const getUnit = async (jobServer, unitIndex, setPreparedUnit, setUnitIndex) => {
  if (unitIndex < 0) return;
  try {
    const unit = await jobServer.getUnit(unitIndex);
    setPreparedUnit({
      jobServer,
      unitId: unit.id,
      ...unit.unit,
      annotations: unit.annotation,
      status: unit.status,
    });
  } catch (e) {
    if (e.response?.status === 404) setUnitIndex(null);
    setPreparedUnit(null);
    console.log(e);
  }
};

const getWindowSize = (jobServer) => {
  switch (jobServer?.codebook?.type) {
    case "questions":
      return ["800px", "1000px"];
    case "annotate":
      return ["2000px", "2000px"];
    default:
      return ["100%", "100%"];
  }
};

const Finished = ({ jobServer }) => {
  if (!jobServer) return null;

  if (!jobServer.getAllAnnotations) {
    return (
      <Grid container centered verticalAlign="middle" style={{ margin: "0", padding: "0" }}>
        <Grid.Row style={{ marginTop: "40%" }}>
          <div>
            <Icon name="flag checkered" size="huge" style={{ transform: "scale(5)" }} />
          </div>
        </Grid.Row>
      </Grid>
    );
  } else {
    return (
      <Grid container centered verticalAlign="middle" style={{ margin: "0", padding: "0" }}>
        <Grid.Row style={{ marginTop: "40%" }}>
          <Grid.Column width={4}>
            <Icon name="flag checkered" size="huge" style={{ transform: "scale(1)" }} />
          </Grid.Column>
          <Grid.Column width={8}>
            <Header>You finished the codingjob!</Header>
            <p>Please download your results and send them to whoever gave you this job. </p>
            <DownloadAnnotations jobServer={jobServer} />
          </Grid.Column>
        </Grid.Row>
      </Grid>
    );
  }
};

export default Annotator;
