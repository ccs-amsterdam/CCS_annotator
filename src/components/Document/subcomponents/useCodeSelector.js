import React, { useState, useEffect, useRef } from "react";
import { Button, Dropdown, Grid, Popup, Ref } from "semantic-ui-react";
import { toggleSpanAnnotation } from "library/annotations";
import { codeBookEdgesToMap } from "library/codebook";
import { getColor } from "library/tokenDesign";
import { moveDown, moveUp } from "library/refNavigation";

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
  const [overwrites, setOverwrites] = useState([]);
  const [variable, setVariable] = useState(null);
  const [tokenRef, setTokenRef] = useState(null);
  const [tokenAnnotations, setTokenAnnotations] = useState({});

  const [fullVariableMap, setFullVariableMap] = useState(null);
  const [variableMap, setVariableMap] = useState(null);

  const [codeHistory, setCodeHistory] = useState({});
  const setSelectedCodeHistory = React.useCallback(
    (value) => {
      setCodeHistory((state) => {
        state[selectedVariable] = value;
        return state;
      });
    },
    [selectedVariable, setCodeHistory]
  );

  useEffect(() => {
    // creates fullVariableMap
    if (!variables || variables.length === 0) {
      setFullVariableMap(null);
      return null;
    }

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
    setCodeHistory({});
  }, [variables, setFullVariableMap, setCodeHistory]);

  useEffect(() => {
    // creates the actually used variableMap from the fullVariableMap
    // this lets us select specific variables without recreating full map
    if (fullVariableMap === null) {
      setVariableMap(null);
      return;
    }
    if (selectedVariable === null || selectedVariable === "ALL") {
      setVariableMap(fullVariableMap);
      setVariable(null);
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

  const triggerFunction = (index, selection) => {
    setTokenRef(tokens[index].ref);
    setTokenAnnotations(annotations[index] || {});
    setSelection(selection);
    setOpen(true);
  };

  let popup = (
    <CodeSelectorPopup
      variable={variable}
      fullScreenNode={fullScreenNode}
      open={open}
      setOpen={setOpen}
      tokenRef={tokenRef}
      overwrites={overwrites}
    >
      <SelectVariablePage // when editing existing annotation, choose which is the 'current' code to edit
        variable={variable}
        setVariable={setVariable}
        setOverwrites={setOverwrites}
        variableMap={variableMap}
        annotations={annotations}
        selection={selection}
        setOpen={setOpen}
        canBeNew={selection !== null} // if no selection is provided, can only edit existing codes
      />

      <NewCodePage // if current is known, select what the new code should be (or delete, or ignore)
        variable={variable}
        variableMap={variableMap}
        overwrites={overwrites}
        codeMap={variableMap?.[variable]?.codeMap}
        settings={variableMap?.[variable]}
        codeHistory={codeHistory[selectedVariable] || []}
        annotations={tokenAnnotations}
        setAnnotations={setAnnotations}
        selection={selection}
        setOpen={setOpen}
        setCodeHistory={setSelectedCodeHistory}
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
  overwrites,
}) => {
  const [hasOpened, setHasOpened] = useState(false);

  const overwriteWarning = () => {
    if (!variable || overwrites.length === 0) return;
    let message =
      overwrites.length === 1 ? `existing annotation` : `${overwrites.length} existing annotations`;
    return <div style={{ margin: "1em" }}>Overwrites {message}</div>;
  };

  return (
    <Popup
      mountNode={fullScreenNode || undefined}
      context={tokenRef}
      hoverable
      open={open}
      mouseLeaveDelay={10000000} // just don't use mouse leave
      onOpen={() => setHasOpened(true)}
      onClose={() => {
        if (hasOpened) {
          setOpen(false);
        }
      }}
      style={{ padding: "0px", minWidth: "15em" }}
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
        ) : (
          <>
            <b>{variable}</b>{" "}
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
      {overwriteWarning()}
      <div style={{ margin: "1em", border: "0px" }}>{children}</div>
    </Popup>
  );
};

const SelectVariablePage = ({
  variable,
  setVariable,
  setOverwrites,
  annotations,
  selection,
  canBeNew,
  setOpen,
  variableMap,
}) => {
  const setValue = async (value) => {
    const current = new Set();
    for (let i = selection.span[0]; i <= selection.span[1]; i++) {
      if (annotations?.[i]?.[value]) {
        const annId = annotations?.[i]?.[value].span[0] + "_" + annotations?.[i]?.[value].value;
        current.add(annId);
      }
    }

    if (current.size > 0) {
      setOverwrites(Array.from(current));
    } else {
      setOverwrites([]);
    }
    setVariable(value);
  };

  const getOptions = () => {
    let variables = Object.keys(variableMap);
    if (!canBeNew) variables = variables.filter((variable) => annotations[variable] != null);
    return variables.map((variable) => ({ color: "white", label: variable, value: variable }));
  };

  if (variable) return null;

  const options = getOptions();
  if (options.length === 1) {
    setValue(options[0].value);
  }

  return (
    <div>
      <ButtonSelection
        id={"currentCodePageButtons"}
        active={true}
        canDelete={false}
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
  overwrites,
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
        true,
        value,
        selection,
        setAnnotations,
        setOpen,
        codeHistory,
        setCodeHistory
      );
    } else {
      updateAnnotations(
        annotations,
        variable,
        false,
        value,
        selection,
        setAnnotations,
        setOpen,
        codeHistory,
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
    const canDelete = overwrites.length > 0;
    if (options.length === 0) return null;
    if (options.length === 1 && !canDelete) onButtonSelect(options[0].value);

    return (
      <ButtonSelection
        id={"newCodePageButtons"}
        active={focusOnButtons}
        canDelete={canDelete}
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
    // also, if buttonmode is 'recent', always show search box
    if (settings && !settings.searchBox && settings.buttonMode !== "recent") return null;
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
                      false,
                      d.value,
                      selection,
                      setAnnotations,
                      setOpen,
                      codeHistory,
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

const ButtonSelection = ({ id, active, options, canDelete, setOpen, callback }) => {
  const [selected, setSelected] = useState(0);
  const [allOptions, setAllOptions] = useState([]);

  useEffect(() => {
    let allOptions = [...options];
    if (canDelete)
      allOptions.push({ label: "DELETE", color: "red", value: null, textColor: "white" });
    allOptions.push({ label: "CANCEL", color: "grey", value: "CANCEL", textColor: "white" });
    for (let option of allOptions) option.ref = React.createRef();
    setAllOptions(allOptions);
  }, [options, canDelete, setAllOptions]);

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
          setSelected(moveDown(allOptions, selected));
        }

        if (event.key === "ArrowLeft") {
          if (selected > 0) setSelected(selected - 1);
        }

        if (event.key === "ArrowUp") {
          setSelected(moveUp(allOptions, selected));
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
    [selected, callback, allOptions, setOpen]
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
        <Ref innerRef={option.ref}>
          <Button
            style={{
              flex: `1 1 auto`,
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
              if (d.value === "CANCEL") {
                setOpen(false);
              } else callback(d.value);
            }}
          >
            {" " + option.label}
          </Button>
        </Ref>
      );
    });
  };

  return (
    <div key={id} style={{ display: "flex", flexWrap: "wrap" }}>
      {mapButtons()}
    </div>
  );
};

const updateAnnotations = (
  annotations,
  variable,
  deleteCurrent,
  value,
  selection,
  setAnnotations,
  setOpen,
  codeHistory,
  setCodeHistory
) => {
  if (!annotations) {
    setOpen(false);
    return null;
  }

  let rmAnnotation = { ...selection, variable };
  if (deleteCurrent) {
    setAnnotations((state) => toggleSpanAnnotation({ ...state }, rmAnnotation, true));
    setOpen(false);
    return null;
  }

  let newAnnotation = { ...selection, variable, value };
  setAnnotations((state) => {
    const newstate = toggleSpanAnnotation({ ...state }, rmAnnotation, true);
    return toggleSpanAnnotation(newstate, newAnnotation, false);
  });
  setCodeHistory([value, ...codeHistory.filter((v) => v !== value)].slice(0, 5));
  setOpen(false);
};

export default useCodeSelector;
