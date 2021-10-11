import React, { useState, useEffect, useRef } from "react";
import { useSelector, useDispatch } from "react-redux";
import { Button, Dropdown, Grid, Popup, Ref } from "semantic-ui-react";
import {
  appendCodeHistory,
  toggleSpanAnnotations,
  rmSpanAnnotations,
  blockEvents,
  triggerCodeselector,
  clearTokenSelection,
} from "actions";
import { getColor } from "util/tokenDesign";

const arrowKeys = ["ArrowRight", "ArrowLeft", "ArrowUp", "ArrowDown"];

const CodeSelector = React.memo(({ children, codebook, annotations, currentCode, selection }) => {
  const [current, setCurrent] = useState(currentCode);
  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(blockEvents(true));
    return () => {
      dispatch(blockEvents(false));
      dispatch(triggerCodeselector(null, null, null));
    };
  }, [dispatch]);

  return (
    <CodeSelectorPopup
      current={current}
      codebook={codebook}
      setCurrent={setCurrent}
      annotations={annotations}
      selection={selection}
    >
      {children}
    </CodeSelectorPopup>
  );
});

const CodeSelectorPopup = ({ children, codebook, current, setCurrent, annotations, selection }) => {
  const [open, setOpen] = useState(true);
  const fullScreenNode = useSelector((state) => state.fullScreenNode);

  const codeMap = Object.keys(codebook.codeMap).reduce((obj, key) => {
    const singleSelection = selection === null || selection?.span[0] === selection.span[1];
    if (singleSelection && current && annotations[key]) return obj;
    if (!codebook.codeMap[key].active || !codebook.codeMap[key].activeParent) return obj;
    obj[key] = codebook.codeMap[key];
    return obj;
  }, {});

  const codeHistory = useSelector((state) => state.codeHistory);
  const dispatch = useDispatch();

  const [hasOpened, setHasOpened] = useState(false);

  return (
    <Popup
      mountNode={fullScreenNode || undefined}
      trigger={children}
      flowing
      hoverable
      wide
      open={open}
      mouseLeaveDelay={10000000} // just don't use mouse leave
      onOpen={() => setHasOpened(true)}
      onClose={() => {
        if (hasOpened) {
          setTimeout(() => {
            dispatch(clearTokenSelection());
            dispatch(triggerCodeselector(null, null, null));
          }, 10);
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
            if (current === "UNASSIGNED")
              updateAnnotations(annotations, current, current, selection, dispatch);
            dispatch(triggerCodeselector(null, null, null, null));
            dispatch(clearTokenSelection());
          }}
        />
      </div>
      <div style={{ margin: "1em", border: "0px" }}>
        <CurrentCodePage
          current={current}
          itemSettings={codebook}
          annotations={annotations}
          canBeNew={selection !== null} // if no selection is provided, can only edit existing codes
          codeMap={codeMap}
          setCurrent={setCurrent}
        />
        <NewCodePage
          codeHistory={codeHistory}
          itemSettings={codebook}
          codeMap={codeMap}
          annotations={annotations}
          selection={selection}
          current={current}
        />
      </div>
    </Popup>
  );
};

const CurrentCodePage = ({ current, itemSettings, annotations, canBeNew, codeMap, setCurrent }) => {
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
        itemSettings={itemSettings}
        options={options}
        canDelete={false}
        callback={onButtonSelect}
      />
    </div>
  );
};

const NewCodePage = ({ codeHistory, itemSettings, codeMap, annotations, selection, current }) => {
  const textInputRef = useRef(null);
  const dispatch = useDispatch();
  const [focusOnButtons, setFocusOnButtons] = useState(true);

  const onKeydown = React.useCallback(
    (event) => {
      const focusOnTextInput = textInputRef?.current?.children[0] === document.activeElement;
      if (!focusOnTextInput) setFocusOnButtons(true);

      if (event.keyCode === 27) dispatch(triggerCodeselector(null));
      if (arrowKeys.includes(event.key)) return null;
      if (event.keyCode <= 46 || event.keyCode >= 106) return null;
      if (textInputRef.current) textInputRef.current.click();
      setFocusOnButtons(false);
    },
    [textInputRef, dispatch]
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
      updateAnnotations(annotations, current, current, selection, dispatch);
    } else {
      updateAnnotations(annotations, current, value, selection, dispatch);
    }
  };

  const getOptions = (codeHistory, n) => {
    if (itemSettings && itemSettings.buttonMode === "all") {
      return Object.keys(codeMap).reduce((options, code) => {
        options.push({ key: code, label: code, color: getColor(code, codeMap) });
        return options;
      }, []);
    } else {
      return codeHistory.reduce((options, code) => {
        if (options.length <= n && codeMap[code])
          options.push({ key: code, label: code, color: getColor(code, codeMap) });
        return options;
      }, []);
    }
  };

  const searchBoxDropdown = () => {
    if (itemSettings && itemSettings.buttonMode !== "recent" && !itemSettings.searchBox)
      return null;
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
                  if (tree === "") tree = "Root";
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
                    updateAnnotations(annotations, current, d.value, selection, dispatch);
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
  return (
    <>
      {searchBoxDropdown()}
      <ButtonSelection
        key={"newCodePageButtons"}
        active={focusOnButtons}
        itemSettings={itemSettings}
        options={getOptions(codeHistory, 5)}
        canDelete={true}
        callback={onButtonSelect}
      />
      &nbsp;&nbsp;
    </>
  );
};

const ButtonSelection = ({ active, options, itemSettings, canDelete, callback }) => {
  // render buttons for options (an array of objects with keys 'label' and 'color')
  // On selection perform callback function with the button label as input
  // if canDelete is TRUE, also contains a delete button, which passes null to callback
  const [selected, setSelected] = useState(0);

  const rowSize = itemSettings?.annotate?.rowSize || 5;

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

const updateAnnotations = (annotations, current, value, selection, dispatch) => {
  if (!annotations) return null;

  let ann;
  if (annotations[current]) {
    ann = { ...annotations[current] };
  } else {
    ann = { ...selection };
  }
  ann.group = current;

  let oldAnnotation = { ...ann };
  oldAnnotation.span = [oldAnnotation.index, oldAnnotation.index];
  dispatch(rmSpanAnnotations([oldAnnotation]));

  if (value === current) {
    dispatch(triggerCodeselector(null, null, null, null));
    return null;
  }

  let newAnnotations = [];
  for (let i = ann.span[0]; i <= ann.span[1]; i++) {
    let newAnnotation = { ...ann };
    newAnnotation.group = value;
    newAnnotation.code = value;
    newAnnotation.index = i;
    newAnnotations.push(newAnnotation);
  }
  dispatch(toggleSpanAnnotations(newAnnotations));
  dispatch(appendCodeHistory(value));
  dispatch(triggerCodeselector(null, null, null, null));
  dispatch(clearTokenSelection());
};

export default CodeSelector;
