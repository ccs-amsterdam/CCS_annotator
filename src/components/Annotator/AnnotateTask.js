import React, { useState, useEffect } from "react";
import { Container, Grid, List, ListItem, Table, Button, Modal } from "semantic-ui-react";
import AnnotateTable from "./subcomponents/AnnotateTable";
import Document from "components/Document/Document";
import { codeBookEdgesToMap } from "library/codebook";
import { useSelector } from "react-redux";

const AnnotateTask = ({ unit, codebook, setUnitIndex, blockEvents }) => {
  const [annotations, setAnnotations] = useAnnotations(unit);
  const [variableMap, setVariableMap] = useState(null);

  useEffect(() => {
    // settings is an array with the settings for each question
    // This needs a little preprocessing, so we only update it when codebook changes (not per unit)
    const vm = {};
    for (let variable of codebook.variables) {
      if (!variable?.codes) return null;
      const codeMap = codeBookEdgesToMap([...variable.codes]);
      vm[variable.name] = { ...variable, codeMap };
    }
    setVariableMap(vm);
  }, [codebook, setVariableMap]);

  if (!unit || codebook?.variables === null) return null;

  return (
    <Grid
      centered
      stackable
      style={{ height: "100%", width: "100%", paddingTop: "0", overflow: "auto" }}
      verticalAlign={"top"}
      columns={2}
    >
      <Grid.Column width={10} style={{ paddingRight: "0em", height: "100%" }}>
        <Button.Group fluid style={{ padding: "0", height: "40px" }}>
          <Instructions codebook={codebook} />
          <NextUnitButton setUnitIndex={setUnitIndex} />
        </Button.Group>
        <div style={{ height: "calc(100% - 40px" }}>
          <Document
            unit={unit}
            variables={codebook?.variables}
            onChangeAnnotations={setAnnotations}
            blockEvents={blockEvents}
          />
        </div>
      </Grid.Column>
      <Grid.Column
        width={6}
        style={{
          paddingRight: "0em",
          height: "100%",
        }}
      >
        <AnnotateTable variableMap={variableMap} annotations={annotations} />
      </Grid.Column>
    </Grid>
  );
};

const useAnnotations = (unit) => {
  // simple hook for onChangeAnnotations that posts to server and returns state
  const [annotations, setAnnotations] = useState([]);

  useEffect(() => {
    if (!unit) return;
    setAnnotations(unit.annotations || []);
  }, [unit, setAnnotations]);

  const onChangeAnnotations = React.useCallback(
    (newAnnotations) => {
      setAnnotations(newAnnotations);
      unit.jobServer.postAnnotations(unit.unitId, newAnnotations);
    },
    [unit]
  );

  return [annotations, onChangeAnnotations];
};

const NextUnitButton = ({ setUnitIndex }) => {
  const [tempDisable, setTempDisable] = useState(false);

  const onNext = () => {
    if (tempDisable) return;
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

const Instructions = () => {
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
          Instructions
        </Button>
      }
    >
      <Modal.Header>Instructions</Modal.Header>
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

export default React.memo(AnnotateTask);
