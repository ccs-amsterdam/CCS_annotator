import React, { useEffect } from "react";
import { Button } from "semantic-ui-react";

const SelectVariable = ({ variables, variable, setVariable, height }) => {
  let variableNames = [];
  if (variables != null) {
    variableNames = variables.map((v) => v.name);
    variableNames.push("ALL");
  }

  const onKeyDown = (e) => {
    let move = 0;
    if (e.keyCode === 9) {
      e.preventDefault();
      if (e.shiftKey) {
        if (!e.repeat) {
          move = -1;
        }
      } else {
        if (!e.repeat) {
          move = 1;
        }
      }
    }

    const currentIndex = variableNames.findIndex((name) => name === variable);
    let newIndex = currentIndex + move;
    if (newIndex > variableNames.length - 1) newIndex = 0;
    if (newIndex < 0) newIndex = variableNames.length - 1;
    setVariable(variableNames[newIndex]);
  };

  useEffect(() => {
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
    };
  });

  if (!variables || variables.length === 1) return null;
  const mapVariables = () => {
    return variableNames.map((name) => {
      return (
        <Button
          active={name === variable}
          style={{ padding: "0" }}
          onClick={() => setVariable(name)}
        >
          {name}
        </Button>
      );
    });
  };

  if (variable === null) setVariable(variableNames[0]);

  return (
    <Button.Group fluid style={{ height }}>
      {mapVariables()}
    </Button.Group>
  );
};

export default SelectVariable;
