import React, { useState, useEffect, useRef } from "react";
import { Button, Dropdown, Grid, Popup, Ref } from "semantic-ui-react";
import { toggleSpanAnnotations } from "util/annotations";
import { codeBookEdgesToMap } from "util/codebook";
import { getColor } from "util/tokenDesign";

const arrowKeys = ["ArrowRight", "ArrowLeft", "ArrowUp", "ArrowDown"];

const useCodeSelector = (tokens, codes, settings, annotations, setAnnotations, fullScreenNode) => {
  const [open, setOpen] = useState(false);
  const [selection, setSelection] = useState(null);
  const [current, setCurrent] = useState(null);
  const [tokenRef, setTokenRef] = useState(null);
  const [tokenAnnotations, setTokenAnnotations] = useState({});
  const [codeMap, setCodeMap] = useState(null);
  const [codeHistory, setCodeHistory] = useState([]);

  useEffect(() => {
    if (!codes || codes.length === 0) return null;
    let cm = codeBookEdgesToMap(codes);
    cm = Object.keys(cm).reduce((obj, key) => {
      if (!cm[key].active || !cm[key].activeParent) return obj;
      obj[key] = cm[key];
      return obj;
    }, {});
    setCodeMap(cm);

    setCodeHistory([]);
  }, [codes, setCodeMap, setCodeHistory]);

  useEffect(() => {
    setOpen(false);
  }, [tokens]);

  if (!codes) return [null, null, null, true];

  const triggerFunction = (index, code, selection) => {
    setTokenRef(tokens[index].ref);
    setTokenAnnotations(annotations[index] || {});
    setSelection(selection);
    setCurrent(code);
    setOpen(true);
  };

  let popup = (
    <CodeSelectorPopup
      fullScreenNode={fullScreenNode}
      open={open}
      setOpen={setOpen}
      tokenRef={tokenRef}
      current={current}
    >
      <CurrentCodePage // when editing existing annotation, choose which is the 'current' code to edit
        current={current}
        codeMap={codeMap}
        settings={settings}
        annotations={tokenAnnotations}
        canBeNew={selection !== null} // if no selection is provided, can only edit existing codes
        setCurrent={setCurrent}
      />
      <NewCodePage // if current is known, select what the new code should be (or delete, or ignore)
        current={current}
        codeMap={codeMap}
        settings={settings}
        codeHistory={codeHistory}
        annotations={tokenAnnotations}
        setAnnotations={setAnnotations}
        selection={selection}
        setOpen={setOpen}
        setCodeHistory={setCodeHistory}
      />
    </CodeSelectorPopup>
  );
  if (!codeMap || !tokens) popup = null;

  return [popup, triggerFunction, codeMap, open];
};

const CodeSelectorPopup = ({ children, fullScreenNode, open, setOpen, tokenRef, current }) => {
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
      style={{ padding: "0px" }}
    >
      <div
        style={{
          minWidth: "12em",
          textAlign: "center",
          height: "1.9em",
          background: "lightgrey",
          border: "1px solid",
        }}
      >
        {!current ? (
          <b>Edit what?</b>
        ) : current === "UNASSIGNED" ? (
          <b>Create new code</b>
        ) : (
          <>
            Edit <b>{current}</b>
          </>
        )}
        <Button
          compact
          floated="right"
          icon="delete"
          size="mini"
          style={{ background: "#80808000", margin: "0px" }}
          onClick={() => {
            setOpen(false);
          }}
        />
      </div>
      <div style={{ margin: "1em", border: "0px" }}>{children}</div>
    </Popup>
  );
};

const CurrentCodePage = ({ current, settings, annotations, canBeNew, codeMap, setCurrent }) => {
  const annotationCodes = Object.keys(annotations);

  const onButtonSelect = (value) => {
    setCurrent(value);
  };

  const getOptions = (annotationCodes) => {
    const options = [];
    if (canBeNew) options.push({ label: "Create new", value: "UNASSIGNED", color: "white" }); // 'value' is optional, but lets us use a different label
    for (let code of annotationCodes)
      if (code !== "UNASSIGNED") options.push({ label: code, color: getColor(code, codeMap) });
    return options;
  };

  if (annotationCodes.length === 0) {
    setCurrent("UNASSIGNED");
    return null;
  }

  const options = getOptions(annotationCodes);
  if (options.length === 1) setCurrent(options[0].label);
  if (current) return null;

  return (
    <div>
      <ButtonSelection
        key={"currentCodePageButtons"}
        active={true}
        settings={settings}
        options={options}
        canDelete={false}
        callback={onButtonSelect}
      />
    </div>
  );
};

const NewCodePage = ({
  codeHistory,
  settings,
  codeMap,
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
    for (let code of Object.keys(codeMap)) {
      const singleSelection = selection === null || selection?.span[0] === selection?.span[1];
      if (singleSelection && annotations[code]) continue;

      if (settings && settings.buttonMode === "all")
        buttonOptions.push({ key: code, label: code, color: getColor(code, codeMap) });

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
        buttonOptions.push({ key: code, label: code, color: getColor(code, codeMap) });
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
        settings={settings}
        options={options}
        canDelete={true}
        callback={onButtonSelect}
      />
    );
  };

  const dropdownSelection = (options) => {
    if (options.length === 0) return null;

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

  if (!current) return null;

  const [buttonOptions, dropdownOptions] = getOptions();

  return (
    <>
      {dropdownSelection(dropdownOptions)}
      {buttonSelection(buttonOptions)}
    </>
  );
};

const ButtonSelection = ({ active, options, settings, canDelete, callback }) => {
  // render buttons for options (an array of objects with keys 'label' and 'color')
  // On selection perform callback function with the button label as input
  // if canDelete is TRUE, also contains a delete button, which passes null to callback
  const [selected, setSelected] = useState(0);

  const rowSize = settings?.rowSize || 5;

  const onKeydown = React.useCallback(
    (event) => {
      const nbuttons = canDelete ? options.length + 1 : options.length;

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

        if (selected === options.length) {
          callback(null); // this means delete button was selected
        } else {
          callback(options[selected].label);
        }
      }
    },
    [selected, callback, options, canDelete, rowSize]
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
    return options.map((option, i) => {
      return (
        <>
          {i % rowSize === 0 ? <br /> : null}
          <Button
            style={{ backgroundColor: option.color, margin: "0" }}
            key={option.label}
            value={option.value || option.label}
            compact
            size="mini"
            active={i === selected}
            onMouseOver={() => setSelected(i)}
            onClick={(e, d) => callback(d.value)}
          >
            {" " + option.label}
          </Button>
        </>
      );
    });
  };

  const deleteButton = () => {
    if (!canDelete) return null;
    return (
      <Button
        key={"trash"}
        icon="trash"
        size="mini"
        floated="right"
        active={selected === options.length}
        compact
        style={{ backgroundColor: "red", borderColor: "black" }}
        onMouseOver={() => setSelected(options.length)}
        onClick={(e, d) => callback(null)}
      />
    );
  };

  return (
    <span>
      {mapButtons()}
      {deleteButton()}
    </span>
  );
};

const updateAnnotations = (
  annotations,
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
  if (annotations[current]) {
    ann = { ...annotations[current] };
  } else {
    ann = { ...selection };
  }
  ann.variable = current;

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
    newAnnotation.variable = value;
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
