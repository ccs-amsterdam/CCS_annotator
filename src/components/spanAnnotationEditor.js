import React from "react";
import { Container, Grid, Header, List, ListItem, Table } from "semantic-ui-react";
import SpanAnnotationsDB from "./SpanAnnotationsDB";
import SpanAnnotationsNavigation from "./SpanAnnotationsNavigation";
import SpanAnnotationsMenu from "./SpanAnnotationsMenu";
import Tokens from "./Tokens";

const gridStyle = { height: "100%", paddingTop: "0" };
const gridStyleTop = { height: "35vh" };
const gridStyleBottom = { overflowY: "auto", height: "45vh" };

const SpanAnnotationEditor = ({ doc, item, contextUnit }) => {
  if (doc === null) return null;

  return (
    <Grid container stackable columns={2} style={gridStyle} verticalAlign={"top"}>
      <Grid.Column width={8} style={{ paddingRight: "0em" }}>
        <Tokens
          doc={doc}
          item={item}
          contextUnit={contextUnit}
          height={75}
          codingUnitPosition={1 / 4}
        />
      </Grid.Column>
      <Grid.Column width={8}>
        <Grid.Row style={gridStyleTop}>
          <SpanAnnotationsMenu doc={doc} tokens={doc.tokens} />
        </Grid.Row>
        <Grid.Row style={gridStyleBottom}>
          <SpanInstructions />
        </Grid.Row>
        <SpanAnnotationsNavigation tokens={doc.tokens} />
        <SpanAnnotationsDB doc={doc} />
      </Grid.Column>
    </Grid>
  );
};

const SpanInstructions = () => {
  return (
    <Container>
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
              <i>shift</i> or <i>spacebar</i>
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
                <ListItem as="li">
                  <i>text input</i> automatically opens dropdown{" "}
                </ListItem>
                <ListItem as="li">
                  select recent codes with <i>arrow keys</i> and <i>Enter</i>
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

export default SpanAnnotationEditor;
