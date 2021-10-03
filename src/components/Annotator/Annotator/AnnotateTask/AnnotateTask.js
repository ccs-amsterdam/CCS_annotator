import React, { useState, useEffect } from "react";
import { Container, Grid, Header, List, ListItem, Table } from "semantic-ui-react";
import AnnotateTable from "./AnnotateTable";
import Document from "components/Tokens/Document";
import useItemBundle from "hooks/useItemBundle";
import { codeBookEdgesToMap } from "util/codebook";

const documentSettings = {
  textUnitPosition: 1 / 4,
  showAnnotations: true,
  canAnnotate: true,
};

const AnnotateTask = ({ item, codebook, preview = false }) => {
  const itemBundle = useItemBundle(item, codebook, documentSettings, preview);
  const [codeMap, setCodeMap] = useState(null);

  useEffect(() => {
    // settings is an array with the settings for each question
    // This needs a little preprocessing, so we only update it when codebook changes (not per item)
    if (!codebook?.taskSettings?.annotate?.codes) return null;
    setCodeMap(codeBookEdgesToMap(codebook.taskSettings.annotate.codes));
  }, [codebook, setCodeMap]);

  if (itemBundle === null || codeMap === null) return null;

  return (
    <Grid
      style={{ height: "100%", width: "100%", paddingTop: "0" }}
      verticalAlign={"top"}
      columns={2}
    >
      <Grid.Column width={8} style={{ paddingRight: "0em", height: "100%" }}>
        <Document itemBundle={itemBundle} codeMap={codeMap} />
      </Grid.Column>
      <Grid.Column
        width={8}
        style={{ paddingRight: "0em", marginTop: "1em", height: "100%", overflow: "auto" }}
      >
        <Grid.Row style={{ height: "60%" }}>
          <AnnotateTable itemBundle={itemBundle} codeMap={codeMap} />
        </Grid.Row>
        <Grid.Row style={{ overflow: "auto", height: "40%" }}>
          <Instructions codebook={codebook} />
        </Grid.Row>
      </Grid.Column>
    </Grid>
  );
};

const Instructions = ({ codebook }) => {
  const settings = codebook?.taskSettings?.annotate;
  if (!settings) return null;
  return (
    <Container style={{ paddingTop: "2em" }}>
      <Header as="h2" align="center">
        Edit span annotations
      </Header>
      <p align="center">Assign codes to words or phrases. A word can have multiple codes.</p>
      <Table unstackable compact size="small">
        <Table.Header>
          <Table.Row>
            <Table.HeaderCell></Table.HeaderCell>
            <Table.HeaderCell>Keyboard</Table.HeaderCell>
            <Table.HeaderCell>Mouse</Table.HeaderCell>
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
          </Table.Row>
          <Table.Row>
            <Table.Cell>
              <strong>Edit code</strong>
            </Table.Cell>
            <Table.Cell>
              <i>Enter</i> when cursor on annotation
            </Table.Cell>
            <Table.Cell>
              <i>Right-click</i> annotation
            </Table.Cell>
          </Table.Row>
        </Table.Body>
        <Table.Footer>
          <Table.Row>
            <Table.HeaderCell>
              <strong>Quick keys</strong> <br />
              in popup
            </Table.HeaderCell>
            <Table.HeaderCell colSpan="2">
              <List as="ul">
                {settings.searchBox || settings.buttonMode === "recent" ? (
                  <ListItem as="li">
                    <i>text input</i> automatically opens dropdown{" "}
                  </ListItem>
                ) : null}
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
  );
};

export default React.memo(AnnotateTask);
