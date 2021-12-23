import React, { useEffect } from "react";
import { Button } from "semantic-ui-react";

const SelectVariable = ({ variables, variable, setVariable, minHeight, editAll }) => {
  let variableNames = [];
  if (variables != null && variables?.length > 0) {
    variableNames = variables.map((v) => v.name);
    if (editAll) variableNames.push("EDIT ALL");
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

  if (variable === null) setVariable(variableNames[0]);
  if (!variables || variables.length === 0) {
    setVariable(null);
    return null;
  }

  const variableObj = variables.find((v) => v.name === variable);
  let helpText = variableObj?.instruction;
  if (variable === "EDIT ALL") helpText = "Show and edit all variables";

  return (
    <div
      style={{
        background: "#1277c469",
        borderBottomLeftRadius: "10px",
        borderBottomRightRadius: "10px",
        borderTop: "2px solid #2185d0",
        textAlign: "center",
      }}
    >
      <VariableButtons
        variable={variable}
        setVariable={setVariable}
        variables={variables}
        variableNames={variableNames}
        minHeight={minHeight}
      />
      <p
        style={{
          margin: "0",
          padding: "2px",
          minHeight: "24px",
        }}
      >
        {helpText}
      </p>
    </div>
  );
};

const VariableButtons = ({ variable, setVariable, variables, variableNames, minHeight }) => {
  if (!variables || variables.length === 1) {
    setVariable(variables[0].name);
    return null;
  }

  const mapVariables = () => {
    if (!variableNames.includes(variable)) setVariable(variableNames[0]);

    return variableNames.map((name) => {
      return (
        <Button
          primary
          active={name === variable}
          style={{
            padding: "0",
            border: "1px solid",
            color: name === variable ? "black" : "white",
          }}
          onClick={() => setVariable(name)}
        >
          {name}
        </Button>
      );
    });
  };

  return (
    <>
      <Button.Group attached="bottom" fluid style={{ minHeight: `${minHeight / 2}px` }}>
        {mapVariables()}
      </Button.Group>
    </>
  );
};

export default SelectVariable;
