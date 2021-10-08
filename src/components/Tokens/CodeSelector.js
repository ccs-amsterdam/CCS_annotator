import React, { useState, useEffect, useRef } from "react";
import { useSelector, useDispatch } from "react-redux";
import { Button, Dropdown, Grid, Popup, Ref } from "semantic-ui-react";
import {
  appendCodeHistory,
  toggleSpanAnnotations,
  rmSpanAnnotations,
  blockEvents,
  triggerCodeselector,
  toggleAnnotation,
} from "actions";
import { getColor } from "util/tokenDesign";

const arrowKeys = ["ArrowRight", "ArrowLeft", "ArrowUp", "ArrowDown"];

const CodeSelector = React.memo(
  ({ children, codebook, annotations, unit, currentCode, newSelection }) => {
    const [current, setCurrent] = useState(newSelection ? "UNASSIGNED" : currentCode);
    const dispatch = useDispatch();

    // When codeselector opens, disable events for spanannotationsnavigation
    // when it closes, make sure to clean up if code is UNASSIGNED
    useEffect(() => {
      dispatch(blockEvents(true));
      return () => {
        dispatch(blockEvents(false));
        if (current === "UNASSIGNED")
          updateAnnotations(annotations, unit, current, current, dispatch);
      };
    });

    return (
      <CodeSelectorPopup
        current={current}
        codebook={codebook}
        setCurrent={setCurrent}
        annotations={annotations}
        unit={unit}
        newSelection={newSelection}
      >
        {children}
      </CodeSelectorPopup>
    );
  }
);

const CodeSelectorPopup = ({
  children,
  codebook,
  current,
  setCurrent,
  annotations,
  unit,
  newSelection,
}) => {
  // separate popup from CodeSelector, because it would rerender CodeSelector,
  // which messes up the useEffect that cleans up after close
  console.log(codebook);
  const codeMap = Object.keys(codebook.codeMap).reduce((obj, key) => {
    if (!newSelection && current && annotations[key]) return obj;
    if (!codebook.codeMap[key].active || !codebook.codeMap[key].activeParent) return obj;
    obj[key] = codebook.codeMap[key];
    return obj;
  }, {});

  const codeHistory = useSelector(state => state.codeHistory);
  const dispatch = useDispatch();

  const [hasOpened, setHasOpened] = useState(false);

  return (
    <Popup
      trigger={children}
      flowing
      hoverable
      wide
      open
      mouseLeaveDelay={10000000} // just don't use mouse leave
      onOpen={() => setHasOpened(true)}
      onClose={() => {
        if (hasOpened) {
          if (current === "UNASSIGNED")
            updateAnnotations(annotations, unit, current, current, dispatch);
          // calling dispatch directly causes a memory leak warning, because it unmounts
          // the component. The very minor async timeout fixes this.
          setTimeout(() => dispatch(triggerCodeselector(null)), 10);
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
          <b>Edit which code?</b>
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
              updateAnnotations(annotations, unit, current, current, dispatch);
            dispatch(triggerCodeselector(null, null, null, null));
          }}
        />
      </div>
      <div style={{ margin: "1em", border: "0px" }}>
        <CurrentCodePage
          current={current}
          itemSettings={codebook}
          annotations={annotations}
          codeMap={codeMap}
          setCurrent={setCurrent}
        />
        <NewCodePage
          codeHistory={codeHistory}
          itemSettings={codebook}
          codeMap={codeMap}
          annotations={annotations}
          unit={unit}
          current={current}
        />
      </div>
    </Popup>
  );
};

const CurrentCodePage = ({ current, itemSettings, annotations, codeMap, setCurrent }) => {
  const annotationCodes = Object.keys(annotations);

  const onButtonSelect = value => {
    setCurrent(value);
  };

  const getOptions = annotationCodes => {
    return annotationCodes.map(code => ({ label: code, color: getColor(code, codeMap) }));
  };

  if (annotationCodes.length === 1) setCurrent(annotationCodes[0]);

  if (current) return null;
  return (
    <div>
      <ButtonSelection
        key={"currentCodePageButtons"}
        active={true}
        itemSettings={itemSettings}
        options={getOptions(annotationCodes)}
        canDelete={false}
        callback={onButtonSelect}
      />
    </div>
  );
};

const NewCodePage = ({ codeHistory, itemSettings, codeMap, annotations, unit, current }) => {
  const textInputRef = useRef(null);
  const dispatch = useDispatch();
  const [focusOnButtons, setFocusOnButtons] = useState(true);

  const onKeydown = React.useCallback(
    event => {
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

  const onButtonSelect = value => {
    if (value === null) {
      // value is null means delete, so in that case update annotations with current value (to toggle it off)
      updateAnnotations(annotations, unit, current, current, dispatch);
    } else {
      updateAnnotations(annotations, unit, current, value, dispatch);
    }
  };

  const getOptions = (codeHistory, n) => {
    console.log("wtf");
    if (itemSettings) console.log(itemSettings.buttonMode);
    if (itemSettings && itemSettings.buttonMode === "all") {
      return Object.keys(codeMap).reduce((options, code) => {
        options.push({ label: code, color: getColor(code, codeMap) });
        return options;
      }, []);
    } else {
      return codeHistory.reduce((options, code) => {
        if (options.length <= n && codeMap[code])
          options.push({ label: code, color: getColor(code, codeMap) });
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
                    updateAnnotations(annotations, unit, current, d.value, dispatch);
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
    event => {
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
            value={option.label}
            compact
            size="mini"
            active={i === selected}
            onMouseOver={() => setSelected(i)}
            onClick={(e, d) => callback(d.value)}
          >
            {/* <div  
              style={{
                position: "relative",
                float: "left",
                fontStyle: "bold",
                marginTop: "-0.5em",
                marginLeft: "-1em",
              }}
            >
              {i + 1}
            </div> */}
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

const updateAnnotations = (annotations, unit, current, value, dispatch) => {
  if (!annotations) return null;

  if (unit === "span") {
    updateSpanAnnotations(annotations, current, value, dispatch);
  } else {
    const ann = annotations[current];
    if (!ann) return;
    dispatch(toggleAnnotation(unit, ann.index, current, null)); // toggleAnnotation with null deletes
    if (current !== value) {
      dispatch(toggleAnnotation(unit, ann.index, value, { ...ann }));
      dispatch(appendCodeHistory(value));
    }
    dispatch(triggerCodeselector(null, null, null, null));
  }
};

const updateSpanAnnotations = (annotations, current, value, dispatch) => {
  if (!annotations) return null;

  let ann = { ...annotations[current] };
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
};

export default CodeSelector;
