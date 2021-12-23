import React, { useState, useEffect, useRef } from "react";
import {
  Container,
  Grid,
  List,
  ListItem,
  Table,
  Button,
  Modal,
  Popup,
  Form,
  Input,
} from "semantic-ui-react";
import AnnotateTable from "./subcomponents/AnnotateTable";
import Document from "components/Document/Document";
import { useSelector } from "react-redux";
import { useCookies } from "react-cookie";

const AnnotateTask = ({ unit, codebook, setUnitIndex, blockEvents }) => {
  const fullScreenNode = useSelector((state) => state.fullScreenNode);
  const [annotations, setAnnotations] = useAnnotations(unit);
  const [variableMap, setVariableMap] = useState(null);
  const [cookies, setCookie] = useCookies(["annotateTaskSettings"]);
  const [settings, setSettings] = useState(cookies.annotateTaskSettings || { textSize: 1 });
  const [tokens, setTokens] = useState(null);

  useEffect(() => {
    setCookie("annotateTaskSettings", JSON.stringify(settings), { path: "/" });
  }, [settings, setCookie]);

  if (!unit || codebook?.variables === null) return null;

  return (
    <Grid
      centered
      stackable
      style={{ height: "100%", width: "100%", paddingTop: "0" }}
      verticalAlign={"top"}
      columns={2}
    >
      <Grid.Column width={10} style={{ paddingRight: "0em", paddingTop: "0", height: "100%" }}>
        <Button.Group fluid style={{ padding: "0", height: "40px" }}>
          <SettingsPopup settings={settings} setSettings={setSettings} />
          <UserManual codebook={codebook} />
          <NextUnitButton unit={unit} annotations={annotations} setUnitIndex={setUnitIndex} />
        </Button.Group>
        <div style={{ height: "calc(100% - 20px", fontSize: `${settings.textSize}em` }}>
          <Document
            unit={unit}
            settings={codebook?.settings}
            variables={codebook?.variables}
            onChangeAnnotations={setAnnotations}
            returnTokens={setTokens}
            returnVariableMap={setVariableMap}
            blockEvents={blockEvents}
            fullScreenNode={fullScreenNode}
          />
        </div>
      </Grid.Column>
      <Grid.Column
        width={6}
        style={{
          paddingRight: "0em",
          padding: "0",
          height: "100%",
          paddingLeft: "10px",
        }}
      >
        <div style={{ borderBottom: "1px solid", height: "calc(100%)", overflow: "auto" }}>
          <AnnotateTable tokens={tokens} variableMap={variableMap} annotations={annotations} />
        </div>
      </Grid.Column>
    </Grid>
  );
};

const useAnnotations = (unit) => {
  // simple hook for onChangeAnnotations that posts to server and returns state
  const [annotations, setAnnotations] = useState([]);
  const hasChanged = useRef(false);

  useEffect(() => {
    if (!unit) {
      setAnnotations([]);
      return;
    }
    hasChanged.current = false;
    setAnnotations(unit.annotations || []);
    // if (!unit.annotations || unit.annotations.length === 0)
    //   unit.jobServer.postAnnotations(unit.unitId, [], "IN_PROGRESS");
  }, [unit, setAnnotations]);

  const onChangeAnnotations = React.useCallback(
    (newAnnotations) => {
      setAnnotations(newAnnotations);

      const cleanAnnotations = getCleanAnnotations(newAnnotations);
      if (!hasChanged.current) {
        if (JSON.stringify(cleanAnnotations) === JSON.stringify(unit.annotations)) return;
        hasChanged.current = true;
      }

      unit.jobServer.postAnnotations(unit.unitId, cleanAnnotations, "IN_PROGRESS");
    },
    [unit]
  );

  return [annotations, onChangeAnnotations];
};

const getCleanAnnotations = (annotations) => {
  return annotations.map((na) => {
    return {
      variable: na.variable,
      value: na.value,
      section: na.section,
      offset: na.offset,
      length: na.length,
    };
  });
};

const NextUnitButton = ({ unit, annotations, setUnitIndex }) => {
  const [tempDisable, setTempDisable] = useState(false);

  const onNext = () => {
    if (tempDisable) return;

    // write DONE status
    unit.jobServer.postAnnotations(unit.unitId, getCleanAnnotations(annotations), "DONE");

    setTempDisable(true);
    setUnitIndex((state) => state + 1);
    setTimeout(() => {
      setTempDisable(false);
    }, 1000);
  };

  const onKeyDown = (e) => {
    if (e.ctrlKey && e.keyCode === 13) {
      e.preventDefault();
      onNext();
    }
  };

  useEffect(() => {
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
    };
  });

  return (
    <Button disabled={tempDisable} loading={tempDisable} primary size="tiny" onClick={onNext}>
      Next Unit
    </Button>
  );
};

const UserManual = () => {
  const fullScreenNode = useSelector((state) => state.fullScreenNode);

  const [open, setOpen] = useState(false);
  return (
    <Modal
      mountNode={fullScreenNode || undefined}
      flowing
      open={open}
      onClose={() => setOpen(false)}
      position="bottom left"
      trigger={
        <Button secondary size="tiny" onClick={() => setOpen(!open)}>
          Controls
        </Button>
      }
    >
      <Modal.Header>Controls</Modal.Header>
      <Modal.Content>
        <Container
          style={{
            overflow: "auto",
            paddingTop: "2em",
            width: "100%",
            maxWidth: "700px",
          }}
        >
          <Table structured compact basic="very" unstackable>
            <Table.Header>
              <Table.Row>
                <Table.HeaderCell width={3}></Table.HeaderCell>
                <Table.HeaderCell>Keyboard</Table.HeaderCell>
                <Table.HeaderCell>Mouse</Table.HeaderCell>
                <Table.HeaderCell>Touchpad</Table.HeaderCell>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              <Table.Row>
                <Table.Cell>
                  <strong>Navigate</strong>
                </Table.Cell>
                <Table.Cell>
                  <i>Arrow keys</i>
                </Table.Cell>
                <Table.Cell></Table.Cell>
                <Table.Cell></Table.Cell>
              </Table.Row>
              <Table.Row>
                <Table.Cell>
                  <strong>Select words</strong>
                </Table.Cell>
                <Table.Cell>
                  <i>spacebar</i>
                  <br />
                  Hold to select mutiple
                </Table.Cell>
                <Table.Cell>
                  <i>Left-click</i>
                  <br />
                  Hold to select multiple
                </Table.Cell>
                <Table.Cell>
                  <i>tab</i> twice to begin, then once to close
                </Table.Cell>
              </Table.Row>
              <Table.Row>
                <Table.Cell>
                  <strong>Edit/remove code</strong>
                </Table.Cell>
                <Table.Cell colSpan="3">
                  Select annotated words to overwrite or delete the code
                </Table.Cell>
              </Table.Row>
              <Table.Row>
                <Table.Cell>
                  <strong>
                    Select variable
                    <br />
                    (if multiple)
                  </strong>
                </Table.Cell>
                <Table.Cell>
                  Next with <i>tab</i>, previous with <i>shift+tab</i>
                </Table.Cell>
                <Table.Cell colSpan="2">Use the buttons</Table.Cell>
              </Table.Row>
              <Table.Row>
                <Table.Cell>
                  <strong>Next unit</strong>
                </Table.Cell>
                <Table.Cell>
                  <i>ctrl+Enter</i>
                </Table.Cell>
                <Table.Cell colSpan="2">Use the next unit button</Table.Cell>
              </Table.Row>
              {/* <Table.Row>
              <Table.Cell>
                <strong>
                  Browse units
                  <br />
                  (if allowed)
                </strong>
              </Table.Cell>
              <Table.Cell>
                Press or hold <i>ctrl+Enter</i> (forward) or <i>ctrl+backspace</i> (backward)
              </Table.Cell>
              <Table.Cell>back and next buttons (top-left)</Table.Cell>
              <Table.Cell>back and next buttons (top-left)</Table.Cell>
            </Table.Row> */}
            </Table.Body>
            <Table.Footer>
              <Table.Row>
                <Table.HeaderCell>
                  <strong>Quick keys</strong> <br />
                  in popup
                </Table.HeaderCell>
                <Table.HeaderCell colSpan="3">
                  <List as="ul">
                    <ListItem as="li">
                      <i>text input</i> automatically opens dropdown{" "}
                    </ListItem>
                    <ListItem as="li">
                      navigate buttons with <i>arrow keys</i>, select with <i>spacebar</i>
                    </ListItem>
                    <ListItem as="li">
                      use <i>escape</i> to close popup and <i>delete</i> to remove code
                    </ListItem>
                  </List>
                </Table.HeaderCell>
              </Table.Row>
            </Table.Footer>
          </Table>
        </Container>
      </Modal.Content>
      <Modal.Actions>
        <Button content="Close" onClick={() => setOpen(false)} positive />
      </Modal.Actions>
    </Modal>
  );
};

const SettingsPopup = ({ settings, setSettings }) => {
  const fullScreenNode = useSelector((state) => state.fullScreenNode);

  return (
    <Popup
      on="click"
      mountNode={fullScreenNode || undefined}
      trigger={
        <Button
          secondary
          width={1}
          size="large"
          icon="setting"
          style={{
            color: "white",
            maxWidth: "50px",
          }}
        />
      }
    >
      <Form>
        <Form.Group grouped>
          <Form.Field>
            <label>
              text size scaling <font style={{ color: "blue" }}>{`${settings.textSize}`}</font>
            </label>
            <Input
              size="mini"
              step={0.025}
              min={0.4}
              max={1.6}
              type="range"
              value={settings.textSize}
              onChange={(e, d) => setSettings((state) => ({ ...state, textSize: d.value }))}
            />
          </Form.Field>
        </Form.Group>
      </Form>
    </Popup>
  );
};

export default React.memo(AnnotateTask);
