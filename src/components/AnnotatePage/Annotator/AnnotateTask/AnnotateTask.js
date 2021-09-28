import React, { useState } from "react";
import { Container, Grid, Header, List, ListItem, Menu, Table } from "semantic-ui-react";
import AnnotateNavigation from "./AnnotateNavigation";
import AnnotateTable from "./AnnotateTable";
import Tokens from "components/Tokens/Tokens.js";

const gridStyle = { height: "100%", paddingTop: "0" };
const gridStyleTop = { height: "35vh" };
const gridStyleBottom = { overflowY: "auto", height: "45vh" };

const AnnotateTask = ({ taskItem }) => {
  const [menuItem, setMenuItem] = useState("help");

  if (taskItem === null) return null;

  const renderSwitch = (activeItem) => {
    switch (activeItem) {
      case "help":
        return <Instructions />;
      case "settings":
        return <SpanSettings />;
      default:
        return null;
    }
  };

  return (
    <Grid style={gridStyle} verticalAlign={"top"}>
      <Grid.Column width={8} style={{ paddingRight: "0em", maxWidth: "700px" }}>
        <Tokens taskItem={taskItem} height={75} textUnitPosition={1 / 4} />
      </Grid.Column>
      <Grid.Column width={8} style={{ paddingRight: "3em", maxWidth: "500px" }}>
        <Grid.Row style={gridStyleTop}>
          <AnnotateTable taskItem={taskItem} />
        </Grid.Row>
        <Grid.Row style={gridStyleBottom}>
          <Menu pointing secondary size="mini">
            <Menu.Item
              name="help"
              active={menuItem === "help"}
              onClick={(e, d) => setMenuItem(d.name)}
            />
            <Menu.Item
              name="settings"
              active={menuItem === "settings"}
              onClick={(e, d) => setMenuItem(d.name)}
            />
          </Menu>
          {renderSwitch(menuItem)}
        </Grid.Row>
        <AnnotateNavigation tokens={taskItem.tokens} />
      </Grid.Column>
    </Grid>
  );
};

const Instructions = () => {
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

const SpanSettings = () => {
  return <div>stuff</div>;
};

export default React.memo(AnnotateTask);
