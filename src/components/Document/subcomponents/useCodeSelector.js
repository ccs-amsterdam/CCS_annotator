import React, { useState, useEffect, useRef } from "react";
import { Button, Dropdown, Grid, Icon, Popup, Ref } from "semantic-ui-react";
import { toggleSpanAnnotation } from "library/annotations";
import { codeBookEdgesToMap } from "library/codebook";
import { getColor, getColorGradient } from "library/tokenDesign";
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
  const [existing, setExisting] = useState([]);
  const [variable, setVariable] = useState(null);
  const [tokenRef, setTokenRef] = useState(null);
  const [tokenAnnotations, setTokenAnnotations] = useState({});

  const [fullVariableMap, setFullVariableMap] = useState(null);
  const [variableMap, setVariableMap] = useState(null);

  const [codeHistory, setCodeHistory] = useState({});

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
    if (!tokens[index].ref) return;
    setTokenRef(tokens[index].ref);
    setTokenAnnotations(annotations[index] || {});
    setSelection(selection || { index }); // if selection is empty, pass index, and get selection in selectVariablePage
    setOpen(true);
  };

  let popup = (
    <CodeSelectorPopup
      variable={variable}
      fullScreenNode={fullScreenNode}
      open={open}
      setOpen={setOpen}
      tokenRef={tokenRef}
      existing={existing}
    >
      <SelectVariablePage // when editing existing annotation, choose which is the 'current' code to edit
        variable={variable}
        setVariable={setVariable}
        setExisting={setExisting}
        variableMap={variableMap}
        annotations={annotations}
        selection={selection}
        setSelection={setSelection}
        setOpen={setOpen}
      />

      <NewCodePage // if current is known, select what the new code should be (or delete, or ignore)
        tokens={tokens}
        variable={variable}
        variableMap={variableMap}
        existing={existing}
        codeMap={variableMap?.[variable]?.codeMap}
        settings={variableMap?.[variable]}
        codeHistory={codeHistory[variable] || []}
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
  existing,
}) => {
  const [hasOpened, setHasOpened] = useState(false);

  return (
    <Popup
      mountNode={fullScreenNode || undefined}
      context={tokenRef}
      wide
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
          overflow: "auto",
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
      <div style={{ margin: "1em", border: "0px" }}>{children}</div>
    </Popup>
  );
};

const SelectVariablePage = ({
  variable,
  setVariable,
  setExisting,
  annotations,
  selection,
  setSelection,
  setOpen,
  variableMap,
}) => {
  const setVariableCallback = async (variable) => {
    if (selection.span) {
      const annMap = {};

      for (let i = selection.span[0]; i <= selection.span[1]; i++) {
        if (annotations?.[i]) {
          for (let id of Object.keys(annotations[i])) {
            const a = annotations[i][id];
            if (a.variable !== variable) continue;
            const annId = a.span[0] + "_" + id;
            annMap[annId] = { id, ...annotations[i][id] };
          }
        }
      }

      if (Object.keys(annMap).length > 0) {
        setExisting(Object.values(annMap));
      } else {
        setExisting([]);
      }
    }
    // remove edit mode.
    // instead, make mode where annotations are disabled, but there are popups with buttons for imported annotations

    // } else {

    //   // selection can not have a span in editMode. In this case, there can be only one annotation for
    //   // a given variable, and we want to take the position of this annotation as the selection
    //   // also, note that there HAS to be an annotation on the current index for this to happen
    //   const annotation = annotations[selection.index][variable];
    //   setSelection({
    //     index: selection.index,
    //     span: annotation.span,
    //     length: annotation.length,
    //     section: annotation.section,
    //     offset: annotation.offset,
    //   });
    //   setExisting([{ variable, ...annotation }]);
    // }

    setVariable(variable);
  };

  const getOptions = () => {
    let variables = Object.keys(variableMap);

    const variableColors = {};
    for (let v of variables) {
      const colors = {};
      for (let i = selection.span[0]; i <= selection.span[1]; i++) {
        if (!annotations[i]) continue;
        for (let id of Object.keys(annotations[i])) {
          const a = annotations[i][id];
          if (a.variable !== v) continue;
          colors[a.value] = getColor(a.value, variableMap?.[v]?.codeMap);
        }
      }
      variableColors[v] = getColorGradient(Object.values(colors));
    }

    return variables.map((variable) => ({
      color: variableColors[variable],
      label: variable,
      value: variable,
    }));
  };

  if (variable) return null;

  const options = getOptions();
  if (options.length === 1) {
    setVariableCallback(options[0].value);
  }

  return (
    <div>
      <ButtonSelection
        id={"currentCodePageButtons"}
        active={true}
        options={options}
        setOpen={setOpen}
        callback={setVariableCallback}
      />
    </div>
  );
};

const NewCodePage = ({
  tokens,
  variable,
  variableMap,
  codeHistory,
  settings,
  annotations,
  setAnnotations,
  selection,
  existing,
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

    // const existingValueCount = Object.values(existing).reduce((em, e) => {
    //   if (!em[e.value]) em[e.value] = 0;
    //   em[e.value]++;
    //   return em;
    // }, {});

    for (let code of Object.keys(codeMap)) {
      const singleSelection = selection === null || selection?.span[0] === selection?.span[1];
      if (singleSelection && annotations[code]) continue;

      if (settings && settings.buttonMode === "all")
        buttonOptions.push({ key: code, label: code, value: code, color: getColor(code, codeMap) });

      let tree = codeMap[code].tree.join(" - ");

      // let existingmessage = null;
      // if (existingValueCount[code]) {
      //   existingmessage = (
      //     <span style={{ color: "darkred" }}>{`overwrites ${existingValueCount[code]}`}</span>
      //   );
      // }

      dropdownOptions.push({
        key: code,
        value: code,
        text: code + " test" + tree,
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

    if (existing && existing.length > 0) {
      for (let o of existing) {
        console.log(o);
        let text = tokens.slice(o.span[0], o.span[1] + 1).map((t) => t.pre + t.text + t.post);
        if (text.length > 6) text = [text.slice(0, 3).join(""), " ... ", text.slice(-3).join("")];
        text = text.join("");
        buttonOptions.push({
          box2: true,
          icon: "trash alternate",
          label: `${text}`,
          color: getColor(o.value, codeMap),
          value: o,
          textColor: "darkred",
        });
      }
    }

    return [buttonOptions, dropdownOptions];
  };

  const buttonSelection = (options) => {
    // act automatically if button selection is the only mode, and there are no options or only 1
    if (settings.buttonMode === "all" && !settings.searchBox) {
      if (options.length === 0) return null;
      if (options.length === 1 && existing.length === 0) onButtonSelect(options[0].value);
    }

    return (
      <ButtonSelection
        id={"newCodePageButtons"}
        active={focusOnButtons}
        setAnnotations={setAnnotations}
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
                options={options}
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

const ButtonSelection = ({
  id,
  active,
  options,
  setOpen,
  callback,
  setAnnotations, // deletable is an array of annotatins that can be deleted
}) => {
  const [selected, setSelected] = useState(0);
  const [allOptions, setAllOptions] = useState([]);
  const deleted = useRef({});

  useEffect(() => {
    // add cancel button and (most importantly) add refs used for navigation
    let allOptions = [...options];
    allOptions.push({
      box2: true,
      label: "CANCEL",
      color: "grey",
      value: "CANCEL",
      textColor: "white",
    });

    for (let option of allOptions) option.ref = React.createRef();
    setAllOptions(allOptions);
  }, [options, setAllOptions]);

  const onClickDelete = React.useCallback(
    (value) => {
      if (value === "CANCEL") setOpen(false);
      if (typeof value === "object") {
        setAnnotations((state) => toggleSpanAnnotation({ ...state }, value, true));
        setOpen(false);
        return;
      }
    },
    [setAnnotations, setOpen]
  );

  const onClickSelect = React.useCallback(
    (value) => {
      callback(value);
    },
    [callback]
  );

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
        if (allOptions[selected].box2) {
          onClickDelete(value);
        } else {
          onClickSelect(value);
        }
      }
    },
    [selected, callback, allOptions, onClickDelete, onClickSelect]
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

  const button = (option, i, onClick) => {
    const bcolorSelected = option.icon === "trash alternate" ? "darkred" : "black";

    return (
      <Ref innerRef={option.ref}>
        <Button
          style={{
            flex: `1 1 auto`,
            background: option.color,
            color: option.textColor || "black",
            border: "3px solid",
            borderColor: i === selected ? bcolorSelected : "lightgrey",
            margin: "0",
          }}
          key={option.label}
          value={option.value}
          compact
          size="mini"
          onMouseOver={() => setSelected(i)}
          onClick={(e, d) => onClick(d.value)}
        >
          <Icon name={option.icon} />
          {" " + option.label}
        </Button>
      </Ref>
    );
  };

  const mapButtons = () => {
    let i = 0;
    const selectButtons = [];
    const deleteButtons = [];
    for (let option of allOptions) {
      if (deleted.current[option.value]) continue;
      if (option.box2) {
        deleteButtons.push(button(option, i, onClickDelete));
      } else {
        selectButtons.push(button(option, i, onClickSelect));
      }
      i++;
    }

    return (
      <>
        <div key={id + "1"} style={{ display: "flex", flexWrap: "wrap" }}>
          {selectButtons}
        </div>
        <div key={id + "2"} style={{ display: "flex", flexWrap: "wrap", marginTop: "20px" }}>
          {deleteButtons}
        </div>
      </>
    );
  };

  return <div key={id}>{mapButtons()}</div>;
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
  setCodeHistory((state) => {
    return { ...state, [variable]: [value, ...codeHistory.filter((v) => v !== value)].slice(0, 5) };
  });
  setOpen(false);
};

export default useCodeSelector;
