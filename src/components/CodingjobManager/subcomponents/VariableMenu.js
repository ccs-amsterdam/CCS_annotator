import { blockEvents } from "actions";
import React, { useEffect, useState } from "react";
import { useDispatch } from "react-redux";

import { Menu, Segment, Button, Popup, Form, Input, Checkbox } from "semantic-ui-react";

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
      <Menu attached="top" style={{ width: "100%", overflowX: "auto" }}>
        {Array(variables.length)
          .fill(0)
          .map((v, i) => {
            return (
              <Menu.Item
                onClick={(e, d) => setIndex(i)}
                active={index === i}
                style={{ padding: "0 0", position: "relative" }}
              >
                <div>
                  <div
                    style={{
                      padding: "0 0.5em",
                      height: "100%",
                      cursor: "pointer",
                    }}
                  >
                    {variables[i].enabled != null ? (
                      <Checkbox
                        checked={variables[i].enabled}
                        onChange={() => {
                          variables[i].enabled = !variables[i].enabled;
                          setVariables(variables);
                        }}
                        label={variables[i].name}
                        style={{ margin: "5px 5px 20px -5px" }}
                      />
                    ) : (
                      <div style={{ margin: "5px 5px 20px 0px" }}>{variables[i].name}</div>
                    )}
                    <div style={{ position: "absolute", bottom: "0" }}>
                      <MoveButtons
                        i={i}
                        variables={variables}
                        setVariables={setVariables}
                        index={index}
                        setIndex={setIndex}
                      />
                    </div>
                  </div>
                </div>
              </Menu.Item>
            );
          })}
        <Menu.Item
          icon="plus"
          attached="right"
          position="right"
          style={{ background: "lightblue" }}
          onClick={onAdd}
        />
      </Menu>
      <Segment attached="bottom" style={{ padding: "1em" }}>
        <DeleteButton
          variables={variables}
          setVariables={setVariables}
          index={index}
          setIndex={setIndex}
        />
        <ChangeName variables={variables} setVariables={setVariables} index={index} />
        {children}
      </Segment>
    </div>
  );
};

const setNewName = (name, variables, index, setVariables) => {
  if (variables[index].name === name) return;
  const oldname = variables[index].name;
  variables[index].name = uniqueName(name, variables, index);
  processNameChange(variables, oldname, variables[index].name);
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

  if (variables.length === 0) return null;

  return (
    <Form style={{ width: "50%" }}>
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

  if (variables.length <= 1) return null;
  if (variables[index].enabled != null) return null;

  return (
    <Popup
      hoverable
      open={deleteOpen}
      onClose={() => setDeleteOpen(false)}
      trigger={
        <Button
          icon="delete"
          floated="right"
          style={{ background: "red", zIndex: 100 }}
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
          onClick={(e) => {
            e.stopPropagation();
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
          onClick={(e) => {
            e.stopPropagation();
            onMove("right", i);
          }}
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

  const existingNames = ["REMAINING"];
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

const processNameChange = (variables, oldname, newname) => {
  for (let v of variables) {
    v.codes = v.codes.map((c) => {
      if (c.makes_irrelevant)
        c.makes_irrelevant = c.makes_irrelevant.map((mi) => (mi === oldname ? newname : mi));
      if (c.required_for)
        c.required_for = c.required_for.map((rf) => (rf === oldname ? newname : rf));
      return c;
    });
  }
};

export default VariableMenu;
