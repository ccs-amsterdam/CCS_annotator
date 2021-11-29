import React, { useState, useEffect } from "react";
import { Container, Grid, Header, List, ListItem, Table, Popup, Button } from "semantic-ui-react";
import AnnotateTable from "./subcomponents/AnnotateTable";
import Document from "components/Document/Document";
import { codeBookEdgesToMap } from "library/codebook";

const AnnotateTask = ({ unit, codebook, setUnitIndex, blockEvents }) => {
  const [annotations, setAnnotations] = useState([]);
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
      style={{ height: "100%", width: "100%", paddingTop: "0" }}
      verticalAlign={"top"}
      columns={2}
    >
      <Grid.Column width={10} style={{ paddingRight: "0em", height: "100%" }}>
        <Document
          unit={unit}
          variables={codebook?.variables}
          settings={codebook?.settings}
          onChangeAnnotations={setAnnotations}
          blockEvents={blockEvents}
        />
      </Grid.Column>
      <Grid.Column
        width={6}
        style={{
          paddingRight: "0em",
          height: "100%",
          overflow: "auto",
        }}
      >
        <Button.Group fluid style={{ padding: "0" }}>
          <NextUnitButton setUnitIndex={setUnitIndex} />
          <Instructions codebook={codebook} />
        </Button.Group>
        <AnnotateTable variableMap={variableMap} annotations={annotations} />
      </Grid.Column>
    </Grid>
  );
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
      <br />
      (ctrl + Enter)
    </Button>
  );
};

const Instructions = () => {
  const [open, setOpen] = useState(false);
  return (
    <Popup
      flowing
      open={open}
      position="bottom right"
      trigger={
        <Button secondary size="tiny" onClick={() => setOpen(!open)}>
          Instructions
        </Button>
      }
    >
      <Container style={{ paddingTop: "2em", width: "700px" }}>
        <Header as="h4" align="center">
          Edit span annotations
        </Header>
        <p align="center">Assign codes to words or phrases. A word can have multiple codes.</p>
        <Table unstackable>
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
                <i>tab</i> first word 2 times, then last word 1 time
              </Table.Cell>
            </Table.Row>
            <Table.Row>
              <Table.Cell>
                <strong>Edit code</strong>
              </Table.Cell>
              <Table.Cell>
                Press <i>spacebar</i> (don't hold) on an annotation
              </Table.Cell>
              <Table.Cell>
                <i>Left-click</i> (don't hold) on an annotation
              </Table.Cell>
              <Table.Cell>
                <i>tab</i> an annotation 3 times
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
              <Table.Cell>Use buttons</Table.Cell>
              <Table.Cell>Use buttons</Table.Cell>
            </Table.Row>
            <Table.Row>
              <Table.Cell>
                <strong>Next unit</strong>
              </Table.Cell>
              <Table.Cell>
                <i>ctrl+Enter</i>
              </Table.Cell>
              <Table.Cell>Next Unit button</Table.Cell>
              <Table.Cell>Next Unit button</Table.Cell>
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
    </Popup>
  );
};

export default React.memo(AnnotateTask);
