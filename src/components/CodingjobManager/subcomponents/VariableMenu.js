import { blockEvents } from "actions";
import React, { useEffect, useState } from "react";
import { useDispatch } from "react-redux";

import { Menu, Segment, Button, Popup, Form, Input } from "semantic-ui-react";

const VariableMenu = ({
  children,
  variables,
  setVariables,
  index,
  setIndex,
  newVariableDefaults,
}) => {
  const onAdd = () => {
    const newVariables = {
      ...newVariableDefaults,
      name: uniqueName(newVariableDefaults.name, variables, null),
    };

    variables.push(newVariables);
    setVariables(variables);
  };

  return (
    <div>
      <Menu attached="top">
        {Array(variables.length)
          .fill(0)
          .map((v, i) => {
            return (
              <Menu.Item active={index === i} style={{ padding: "0em", position: "relative" }}>
                <div>
                  <div
                    onClick={(e, d) => setIndex(i)}
                    style={{ padding: "0.5em", cursor: "pointer" }}
                  >
                    {variables[i].name}
                  </div>

                  <div style={{ position: "absolute", zIndex: 10, bottom: "-1.5em" }}>
                    <MoveButtons
                      i={i}
                      variables={variables}
                      setVariables={setVariables}
                      index={index}
                      setIndex={setIndex}
                    />
                  </div>
                </div>
              </Menu.Item>
            );
          })}
        <Menu.Item icon="plus" style={{ background: "lightblue" }} onClick={onAdd} />
        <DeleteButton
          variables={variables}
          setVariables={setVariables}
          index={index}
          setIndex={setIndex}
        />
      </Menu>
      <Segment attached="bottom" style={{ padding: "1em" }}>
        <br />
        <ChangeName variables={variables} setVariables={setVariables} index={index} />
        {children}
      </Segment>
    </div>
  );
};

const setNewName = (name, variables, index, setVariables) => {
  if (variables[index].name === name) return;
  variables[index].name = uniqueName(name, variables, index);
  setVariables(variables);
};

const ChangeName = ({ variables, setVariables, index }) => {
  const [delayedName, setDelayedName] = useState("");
  const dispatch = useDispatch();

  useEffect(() => {
    if (variables.length === 0) return;
    if (!delayedName || delayedName === variables[index].name) return;
    if (variables[index].name === delayedName) return;
    const timer = setTimeout(() => {
      setNewName(delayedName.trim(), variables, index, setVariables);
    }, 500);
    return () => clearTimeout(timer);
  }, [delayedName, variables, index, setVariables]);

  useEffect(() => {
    if (variables.length === 0) return;
    setDelayedName(variables[index].name);
  }, [variables, index, setDelayedName]);

  return (
    <Form>
      <Form.Group grouped>
        <label>Name</label> <span style={{ fontSize: "10px" }}>(keep it short)</span>
        <Form.Field>
          <Input
            value={delayedName}
            style={{ width: "150px" }}
            onFocus={() => dispatch(blockEvents(true))}
            onBlur={() => dispatch(blockEvents(false))}
            onChange={(e, d) => setDelayedName(d.value)}
          />
        </Form.Field>{" "}
      </Form.Group>
    </Form>
  );
};

const DeleteButton = ({ variables, setVariables, index, setIndex }) => {
  const [deleteOpen, setDeleteOpen] = useState(false);

  const onDelete = () => {
    const newVariables = [];
    for (let i = 0; i < variables.length; i++) {
      if (i !== index) newVariables.push(variables[i]);
    }

    setVariables(newVariables);
    setDeleteOpen(false);
    setIndex(Math.max(0, index - 1));
  };

  if (variables.length === 0) return null;

  return (
    <Popup
      hoverable
      open={deleteOpen}
      onClose={() => setDeleteOpen(false)}
      trigger={
        <Menu.Item
          icon="minus"
          position="right"
          style={{ background: "red" }}
          onClick={() => setDeleteOpen(!deleteOpen)}
        />
      }
    >
      <p>
        Delete <b>{variables[index].name}</b>?
      </p>

      <Button style={{ background: "red" }} onClick={onDelete}>
        yes please
      </Button>
    </Popup>
  );
};

const MoveButtons = ({ i, variables, setVariables, index, setIndex }) => {
  const onMove = (direction, i) => {
    const j = direction === "left" ? Math.max(0, i - 1) : Math.min(variables.length - 1, i + 1);
    const temp = variables[i];

    variables[i] = variables[j];
    variables[j] = temp;

    setVariables(variables);
    setIndex(j);
  };

  if (index !== i) return null;
  return (
    <Button.Group>
      {i > 0 ? (
        <Button
          icon="arrow left"
          onClick={() => {
            onMove("left", i);
          }}
          style={{
            borderRadius: "0",
            padding: "0em",
            background: "rgba(0,0,0,0)",
          }}
        />
      ) : null}
      {i < variables.length - 1 ? (
        <Button
          icon="arrow right"
          onClick={() => onMove("right", i)}
          style={{
            borderRadius: "0",
            padding: "0em",
            background: "rgba(0,0,0,0)",
          }}
        />
      ) : null}
    </Button.Group>
  );
};

const uniqueName = (newName, variables, index) => {
  let uniqueNewName = newName;
  let i = 2;

  const existingNames = [];
  for (let i = 0; i < variables.length; i++) {
    if (index !== null && i === index) continue;
    existingNames.push(variables[i].name);
  }

  while (existingNames.includes(uniqueNewName)) {
    uniqueNewName = newName + ` ${i}`;
    i++;
  }
  return uniqueNewName;
};

export default VariableMenu;
