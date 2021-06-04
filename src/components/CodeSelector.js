import React, { useState, useEffect, useRef } from "react";
import { useSelector, useDispatch } from "react-redux";
import { Button, Dropdown, Grid, Popup, Ref } from "semantic-ui-react";
import {
  appendCodeHistory,
  toggleAnnotations,
  rmAnnotations,
  blockEvents,
  triggerCodeselector,
} from "../actions";

const arrowKeys = ["ArrowRight", "ArrowLeft", "ArrowUp", "ArrowDown"];

const CodeSelector = React.memo(({ children, annotations, currentCode, newSelection }) => {
  const codingjob = useSelector((state) => state.codingjob);
  const codeMap = useSelector((state) => state.codeMap);
  const codeHistory = useSelector((state) => state.codeHistory);

  const [current, setCurrent] = useState(newSelection ? "UNASSIGNED" : currentCode);
  const [hasOpened, setHasOpened] = useState(false);

  // Placeholder: should be managed in state
  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(blockEvents(true));
    return () => {
      dispatch(blockEvents(false));
    };
  }, [dispatch]);

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
            updateAnnotations(annotations, current, current, setCurrent, dispatch);
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
              updateAnnotations(annotations, current, current, setCurrent, dispatch);
            dispatch(triggerCodeselector(null));
          }}
        />
      </div>
      <div style={{ margin: "1em", border: "0px" }}>
        <CurrentCodePage
          current={current}
          annotations={annotations}
          codeMap={codeMap}
          setCurrent={setCurrent}
        />
        <NewCodePage
          codeHistory={codeHistory}
          codingjob={codingjob}
          codeMap={codeMap}
          annotations={annotations}
          current={current}
          setCurrent={setCurrent}
        />
      </div>
    </Popup>
  );
});

const CurrentCodePage = ({ current, annotations, codeMap, setCurrent }) => {
  const annotationCodes = Object.keys(annotations);

  const onButtonSelect = (value) => {
    setCurrent(value);
  };

  const getOptions = (annotationCodes) => {
    return annotationCodes.map((code) => ({ label: code, color: getColor(code, codeMap) }));
  };

  if (annotationCodes.length === 1) setCurrent(annotationCodes[0]);

  if (current) return null;
  return (
    <div>
      <ButtonSelection
        key={"currentCodePageButtons"}
        active={true}
        options={getOptions(annotationCodes)}
        canDelete={false}
        callback={onButtonSelect}
      />
    </div>
  );
};

const NewCodePage = ({ codeHistory, codeMap, annotations, current, setCurrent }) => {
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
      textInputRef.current.click();
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
      updateAnnotations(annotations, current, current, setCurrent, dispatch);
    } else {
      updateAnnotations(annotations, current, value, setCurrent, dispatch);
    }
  };

  const getOptions = (codeHistory, n) => {
    return codeHistory.reduce((options, code) => {
      if (!annotations[code] && options.length <= n)
        options.push({ label: code, color: getColor(code, codeMap) });
      return options;
    }, []);
  };

  if (!current) return null;
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
                if (!annotations[code]) {
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
                }
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
                  updateAnnotations(annotations, current, d.value, setCurrent, dispatch);
              }}
            />
          </Ref>
        </Grid.Column>
      </Grid>
      <br />
      <ButtonSelection
        key={"newCodePageButtons"}
        active={focusOnButtons}
        options={getOptions(codeHistory, 5)}
        canDelete={true}
        callback={onButtonSelect}
      />
      &nbsp;&nbsp;
    </>
  );
};

const ButtonSelection = ({ active, options, canDelete, callback }) => {
  // render buttons for options (an array of objects with keys 'label' and 'color')
  // On selection perform callback function with the button label as input
  // if canDelete is TRUE, also contains a delete button, which passes null to callback
  const [selected, setSelected] = useState(0);

  const onKeydown = React.useCallback(
    (event) => {
      const nbuttons = canDelete ? options.length + 1 : options.length;

      // any arrowkey
      if (arrowKeys.includes(event.key)) {
        event.preventDefault();

        if (event.key === "ArrowRight") {
          if (selected < nbuttons - 1) setSelected(selected + 1);
        }

        if (event.key === "ArrowLeft") {
          if (selected > 0) setSelected(selected - 1);
        }

        return;
      }

      // delete
      if (event.keyCode === 46) callback(null);

      // space or enter
      if (event.keyCode === 32 || event.keyCode === 13) {
        if (selected === options.length) {
          callback(null); // this means delete button was selected
        } else {
          callback(options[selected].label);
        }
      }
    },
    [selected, callback, options, canDelete]
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
        <Button
          style={{ backgroundColor: option.color }}
          key={option.label}
          value={option.label}
          compact
          size="mini"
          active={i === selected}
          onMouseOver={() => setSelected(i)}
          onClick={(e, d) => callback(d.value)}
        >
          {option.label}
        </Button>
      );
    });
  };

  const deleteButton = () => {
    if (!canDelete) return null;
    return (
      <Button
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

const updateAnnotations = (annotations, current, value, setCurrent, dispatch) => {
  if (!annotations) return null;

  let ann = { ...annotations[current] };
  ann.group = current;

  let oldAnnotation = { ...ann };
  oldAnnotation.span = [oldAnnotation.index, oldAnnotation.index];
  dispatch(rmAnnotations([oldAnnotation]));

  if (value === current) {
    dispatch(triggerCodeselector(null, null, null));
    return null;
  }

  let newAnnotations = [];
  for (let i = ann.span[0]; i <= ann.span[1]; i++) {
    let newAnnotation = { ...ann };
    newAnnotation.group = value;
    newAnnotation.index = i;
    newAnnotations.push(newAnnotation);
  }
  dispatch(toggleAnnotations(newAnnotations));
  dispatch(appendCodeHistory(value));

  // if (Object.keys(annotations).includes(null)) {
  //   setCurrent(null);
  // } else {
  //   setCurrent(value);
  // }

  dispatch(triggerCodeselector(null, null, null));
};

const getColor = (tokenCode, codeMap) => {
  if (codeMap[tokenCode]) {
    return codeMap[tokenCode].color;
  } else {
    return "lightgrey";
  }
};

export default CodeSelector;
