import React, { useState, useEffect, useRef } from "react";
import { Button, Dropdown, Grid, Popup, Ref } from "semantic-ui-react";
import { toggleSpanAnnotations } from "util/annotations";
import { codeBookEdgesToMap } from "util/codebook";
import { getColor } from "util/tokenDesign";

const arrowKeys = ["ArrowRight", "ArrowLeft", "ArrowUp", "ArrowDown"];

const useCodeSelector = (
  tokens,
  variables,
  selectedVariable,
  annotations,
  setAnnotations,
  fullScreenNode
) => {
  const [open, setOpen] = useState(false);
  const [selection, setSelection] = useState(null);
  const [current, setCurrent] = useState(null);
  const [variable, setVariable] = useState(null);
  const [tokenRef, setTokenRef] = useState(null);
  const [tokenAnnotations, setTokenAnnotations] = useState({});
  const [codeHistory, setCodeHistory] = useState([]);

  const [fullVariableMap, setFullVariableMap] = useState(null);
  const [variableMap, setVariableMap] = useState(null);

  useEffect(() => {
    // creates fullVariableMap
    if (!variables || variables.length === 0) return null;
    const vm = {};
    for (let variable of variables) {
      let cm = codeBookEdgesToMap(variable.codes);
      cm = Object.keys(cm).reduce((obj, key) => {
        if (!cm[key].active || !cm[key].activeParent) return obj;
        obj[key] = cm[key];
        return obj;
      }, {});
      vm[variable.name] = { ...variable, codeMap: cm };
    }
    setFullVariableMap(vm);
    setCodeHistory([]);
  }, [variables, setFullVariableMap, setCodeHistory]);

  useEffect(() => {
    // creates the actually used variableMap from the fullVariableMap
    // this lets us select specific variables without recreating full map
    if (fullVariableMap === null) return;
    if (selectedVariable === null || selectedVariable === "ALL") {
      setVariableMap(fullVariableMap);
    } else {
      setVariableMap({ [selectedVariable]: fullVariableMap[selectedVariable] });
      setVariable(selectedVariable);
    }
  }, [fullVariableMap, selectedVariable, setVariable, setVariableMap]);

  useEffect(() => {
    setOpen(false);
  }, [tokens]);

  useEffect(() => {
    if (!open) setVariable(null);
  }, [open]);

  if (!variables) return [null, null, null, true];

  const triggerFunction = (index, code, selection) => {
    setTokenRef(tokens[index].ref);
    setTokenAnnotations(annotations[index] || {});
    setSelection(selection);
    setCurrent(code);
    setOpen(true);
  };

  let popup = (
    <CodeSelectorPopup
      variable={variable}
      fullScreenNode={fullScreenNode}
      open={open}
      setOpen={setOpen}
      tokenRef={tokenRef}
      current={current}
    >
      <SelectVariablePage // when editing existing annotation, choose which is the 'current' code to edit
        variable={variable}
        setVariable={setVariable}
        setCurrent={setCurrent}
        variableMap={variableMap}
        annotations={tokenAnnotations}
        setOpen={setOpen}
        canBeNew={selection !== null} // if no selection is provided, can only edit existing codes
      />

      <NewCodePage // if current is known, select what the new code should be (or delete, or ignore)
        variable={variable}
        variableMap={variableMap}
        current={current}
        codeMap={variableMap?.[variable]?.codeMap}
        settings={variableMap?.[variable]}
        codeHistory={codeHistory}
        annotations={tokenAnnotations}
        setAnnotations={setAnnotations}
        selection={selection}
        setOpen={setOpen}
        setCodeHistory={setCodeHistory}
      />
    </CodeSelectorPopup>
  );
  if (!variableMap || !tokens) popup = null;

  return [popup, triggerFunction, variableMap, open];
};

const CodeSelectorPopup = ({
  children,
  variable,
  fullScreenNode,
  open,
  setOpen,
  tokenRef,
  current,
}) => {
  const [hasOpened, setHasOpened] = useState(false);

  return (
    <Popup
      mountNode={fullScreenNode || undefined}
      context={tokenRef}
      flowing
      hoverable
      wide
      open={open}
      mouseLeaveDelay={10000000} // just don't use mouse leave
      onOpen={() => setHasOpened(true)}
      onClose={() => {
        if (hasOpened) {
          setOpen(false);
        }
      }}
      position="top left"
      style={{ padding: "0px", maxWidth: "80vw" }}
    >
      <div
        style={{
          minWidth: "12em",
          textAlign: "center",

          background: "#1B1C1D",
          color: "white",
          border: "1px solid",
        }}
      >
        {!variable ? (
          <b>Select variable</b>
        ) : current === "UNASSIGNED" ? (
          <>
            Select <b>{variable}</b>{" "}
          </>
        ) : (
          <>
            Select <b>{variable}</b> <font style={{ color: "red" }}>!! overwrites current !!</font>
          </>
        )}
        <Button
          compact
          floated="right"
          icon="delete"
          size="mini"
          style={{ background: "#80808000", margin: "0px", color: "white" }}
          onClick={() => {
            setOpen(false);
          }}
        />
      </div>
      <div style={{ margin: "1em", border: "0px" }}>{children}</div>
    </Popup>
  );
};

const SelectVariablePage = ({
  variable,
  setVariable,
  setCurrent,
  annotations,
  canBeNew,
  setOpen,
  variableMap,
}) => {
  const setValue = (value) => {
    if (annotations[value]) {
      setCurrent(annotations[value].code);
    } else {
      setCurrent("UNASSIGNED");
    }
    setVariable(value);
  };

  const getOptions = () => {
    let variables = Object.keys(variableMap);
    if (!canBeNew) variables = variables.filter((variable) => annotations[variable] != null);
    return variables.map((variable) => ({ color: "white", label: variable, value: variable }));
  };

  const options = getOptions();
  if (options.length === 1) {
    setValue(options[0].value);
  }

  if (variable) return null;

  return (
    <div>
      <ButtonSelection
        key={"currentCodePageButtons"}
        active={true}
        current={null}
        settings={{ rowSize: 5 }}
        options={options}
        setOpen={setOpen}
        callback={setValue}
      />
    </div>
  );
};

const NewCodePage = ({
  variable,
  variableMap,
  codeHistory,
  settings,
  annotations,
  setAnnotations,
  selection,
  current,
  setOpen,
  setCodeHistory,
}) => {
  const textInputRef = useRef(null);
  const [focusOnButtons, setFocusOnButtons] = useState(true);

  const onKeydown = React.useCallback(
    (event) => {
      if (settings && !settings.searchBox) return null;
      const focusOnTextInput = textInputRef?.current?.children[0] === document.activeElement;
      if (!focusOnTextInput) setFocusOnButtons(true);
      if (event.keyCode === 27) setOpen(false);
      if (arrowKeys.includes(event.key)) return null;
      if (event.keyCode <= 46 || event.keyCode >= 106) return null;
      if (textInputRef.current) textInputRef.current.click();
      setFocusOnButtons(false);
    },
    [textInputRef, setOpen, settings]
  );

  useEffect(() => {
    window.addEventListener("keydown", onKeydown);
    return () => {
      window.removeEventListener("keydown", onKeydown);
    };
  });

  const onButtonSelect = (value) => {
    if (value === null) {
      // value is null means delete, so in that case update annotations with current value (to toggle it off)
      updateAnnotations(
        annotations,
        variable,
        current,
        current,
        selection,
        setAnnotations,
        setOpen,
        setCodeHistory
      );
    } else {
      updateAnnotations(
        annotations,
        variable,
        current,
        value,
        selection,
        setAnnotations,
        setOpen,
        setCodeHistory
      );
    }
  };

  const getOptions = () => {
    const buttonOptions = [];
    const dropdownOptions = [];
    const historyN = 5; // maybe make this a setting
    const codeMap = variableMap?.[variable]?.codeMap;

    for (let code of Object.keys(codeMap)) {
      const singleSelection = selection === null || selection?.span[0] === selection?.span[1];
      if (singleSelection && annotations[code]) continue;

      if (settings && settings.buttonMode === "all")
        buttonOptions.push({ key: code, label: code, value: code, color: getColor(code, codeMap) });

      let tree = codeMap[code].tree.join(" - ");
      dropdownOptions.push({
        key: code,
        value: code,
        text: code + " " + tree,
        content: (
          <>
            {code}
            <br />
            <span style={{ color: "grey" }}>{tree}</span>
          </>
        ),
      });
    }

    // use 'recent' mode if specified, or if settings are missing
    if (!settings || settings.buttonMode === "recent") {
      for (let code of codeHistory) {
        if (buttonOptions.length > historyN) break;
        buttonOptions.push({ key: code, label: code, value: code, color: getColor(code, codeMap) });
      }
    }
    return [buttonOptions, dropdownOptions];
  };

  const buttonSelection = (options) => {
    if (options.length === 0) return null;
    return (
      <ButtonSelection
        key={"newCodePageButtons"}
        active={focusOnButtons}
        current={current}
        settings={settings}
        options={options}
        setOpen={setOpen}
        callback={onButtonSelect}
      />
    );
  };

  const dropdownSelection = (options) => {
    if (options.length === 0) return null;
    const codeMap = variableMap?.[variable]?.codeMap;
    if (!codeMap) return null;

    // use searchBox if specified OR if settings are missing
    if (settings && !settings.searchBox) return null;
    return (
      <>
        <Grid>
          <Grid.Column width={13} floated="left">
            <Ref innerRef={textInputRef}>
              <Dropdown
                fluid
                placeholder={"<type to search>"}
                style={{ minWidth: "12em" }}
                options={Object.keys(codeMap).reduce((options, code) => {
                  let tree = codeMap[code].tree.join(" - ");
                  //if (tree === "") tree = "Root";
                  options.push({
                    key: code,
                    value: code,
                    text: code + " " + tree,
                    content: (
                      <>
                        {code}
                        <br />
                        <span style={{ color: "grey" }}>{tree}</span>
                      </>
                    ),
                  });

                  return options;
                }, [])}
                open={!focusOnButtons}
                search
                selection
                compact
                selectOnNavigation={false}
                minCharacters={0}
                autoComplete={"on"}
                onClick={() => setFocusOnButtons(false)}
                onSearchChange={(e, d) => {
                  if (d.searchQuery === "") setFocusOnButtons(true);
                }}
                onClose={() => setFocusOnButtons(true)}
                onChange={(e, d) => {
                  if (codeMap[d.value])
                    updateAnnotations(
                      annotations,
                      variable,
                      current,
                      d.value,
                      selection,
                      setAnnotations,
                      setOpen,
                      setCodeHistory
                    );
                }}
              />
            </Ref>
          </Grid.Column>
        </Grid>
        <br />
      </>
    );
  };

  if (!variable) return null;

  const [buttonOptions, dropdownOptions] = getOptions();

  return (
    <>
      {dropdownSelection(dropdownOptions)}
      {buttonSelection(buttonOptions)}
    </>
  );
};
const ButtonSelection = ({ active, options, current, settings, setOpen, callback }) => {
  const [selected, setSelected] = useState(0);
  const [allOptions, setAllOptions] = useState([]);

  useEffect(() => {
    const allOptions = [...options];
    if (current !== null && current !== "UNASSIGNED")
      allOptions.push({ label: "DELETE", color: "red", value: null, textColor: "white" });
    allOptions.push({ label: "CANCEL", color: "grey", value: "CANCEL", textColor: "white" });
    setAllOptions(allOptions);
  }, [options, current, setAllOptions]);

  const rowSize = Number(settings?.rowSize) || 5;

  const onKeydown = React.useCallback(
    (event) => {
      const nbuttons = allOptions.length;

      // any arrowkey
      if (arrowKeys.includes(event.key)) {
        event.preventDefault();

        if (event.key === "ArrowRight") {
          if (selected < nbuttons - 1) setSelected(selected + 1);
        }

        if (event.key === "ArrowDown") {
          if (selected < nbuttons - 1) setSelected(Math.min(selected + rowSize, nbuttons - 1));
        }

        if (event.key === "ArrowLeft") {
          if (selected > 0) setSelected(selected - 1);
        }

        if (event.key === "ArrowUp") {
          if (selected > 0) setSelected(Math.max(0, selected - rowSize));
        }

        return;
      }

      // delete
      if (event.keyCode === 46) callback(null);

      // space or enter
      if (event.keyCode === 32 || event.keyCode === 13) {
        event.preventDefault();
        event.stopPropagation();

        let value = allOptions[selected].value;
        if (value === "CANCEL") {
          setOpen(false);
        } else callback(value);
      }
    },
    [selected, callback, allOptions, setOpen, rowSize]
  );

  useEffect(() => {
    if (active) {
      window.addEventListener("keydown", onKeydown);
    } else {
      window.removeEventListener("keydown", onKeydown);
    }
    return () => {
      window.removeEventListener("keydown", onKeydown);
    };
  }, [active, onKeydown]);

  const mapButtons = () => {
    return allOptions.map((option, i) => {
      return (
        <>
          <Button
            style={{
              flex: `1 1 calc(${Math.floor(100 / rowSize)}% - 6px)`,
              backgroundColor: option.color,
              color: option.textColor || "black",
              border: "3px solid",
              borderColor: i === selected ? "black" : "lightgrey",
              margin: "0",
            }}
            key={option.label}
            value={option.value}
            compact
            size="mini"
            //active={i === selected}
            onMouseOver={() => setSelected(i)}
            onClick={(e, d) => {
              console.log(d.value);
              if (d.value === "CANCEL") {
                setOpen(false);
              } else callback(d.value);
            }}
          >
            {" " + option.label}
          </Button>
        </>
      );
    });
  };

  return <div style={{ display: "flex", flexWrap: "wrap" }}>{mapButtons()}</div>;
};

const updateAnnotations = (
  annotations,
  variable,
  current,
  value,
  selection,
  setAnnotations,
  setOpen,
  setCodeHistory
) => {
  if (!annotations) {
    setOpen(false);
    return null;
  }

  let ann;
  if (annotations[variable]) {
    ann = { ...annotations[variable] };
  } else {
    ann = { ...selection };
  }
  ann.variable = variable;

  let oldAnnotation = { ...ann };
  oldAnnotation.span = [oldAnnotation.index, oldAnnotation.index];

  if (value === current) {
    setAnnotations((state) => toggleSpanAnnotations({ ...state }, [oldAnnotation], true));
    setOpen(false);
    return null;
  }

  let newAnnotations = [];
  for (let i = ann.span[0]; i <= ann.span[1]; i++) {
    let newAnnotation = { ...ann };
    newAnnotation.variable = variable;
    newAnnotation.value = value;
    newAnnotation.index = i;
    newAnnotations.push(newAnnotation);
  }

  setAnnotations((state) => {
    const newstate = toggleSpanAnnotations({ ...state }, [oldAnnotation], true);
    return toggleSpanAnnotations(newstate, newAnnotations, false);
  });
  setCodeHistory((state) => [value, ...state.filter((v) => v !== value)].slice(0, 5));
  setOpen(false);
};

export default useCodeSelector;
