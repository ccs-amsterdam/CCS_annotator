import React, { useState, useEffect, useRef } from "react";
import { useSelector, useDispatch } from "react-redux";
import { Button, Dropdown, Popup, Ref } from "semantic-ui-react";
import {
  appendCodeHistory,
  toggleAnnotations,
  rmAnnotations,
  blockEvents,
  triggerCodeselector,
  setCodes,
} from "../actions";
import db from "../apis/dexie";

const arrowKeys = ["ArrowRight", "ArrowLeft", "ArrowUp", "ArrowDown"];

const CodeSelector = React.memo(({ index, children, annotations, currentCode, newSelection }) => {
  const codingjob = useSelector((state) => state.codingjob);
  const codes = useSelector((state) => state.codes);
  const settings = useSelector((state) => state.codingjobSettings);
  const codeHistory = useSelector((state) => state.codeHistory);

  const [current, setCurrent] = useState(newSelection ? "Not yet assigned" : currentCode);
  const [hasOpened, setHasOpened] = useState(false);

  // Placeholder: should be managed in state
  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(blockEvents(true));
    return () => {
      dispatch(blockEvents(false));
    };
  }, [dispatch]);

  const createPopupPage = () => {
    const annotationCodes = Object.keys(annotations);

    if (current === null) {
      return (
        <CurrentCodePage annotationCodes={annotationCodes} codes={codes} setCurrent={setCurrent} />
      );
    }

    return (
      <NewCodePage
        codeHistory={codeHistory}
        codingjob={codingjob}
        codes={codes}
        settings={settings}
        annotations={annotations}
        current={current}
        setCurrent={setCurrent}
      />
    );
  };

  return (
    <Popup
      trigger={children}
      flowing
      hoverable
      wide
      open
      mouseLeaveDelay={1000}
      onOpen={() => setHasOpened(true)}
      onClose={() => {
        if (hasOpened)
          // calling dispatch directly causes a memory leak warning, because it unmounts
          // the component. The very minor async timeout fixes this.
          setTimeout(() => dispatch(triggerCodeselector(null)), 10);
      }}
      position="top left"
    >
      <div>
        <Button
          floated="right"
          compact
          size="mini"
          icon="delete"
          onClick={() => dispatch(triggerCodeselector(null))}
        />

        {createPopupPage()}
      </div>
    </Popup>
  );
});

const CurrentCodePage = ({ annotationCodes, codes, setCurrent }) => {
  const onButtonSelect = (value) => {
    setCurrent(value);
  };

  const getOptions = (annotationCodes) => {
    return annotationCodes.map((code) => ({ label: code, color: getColor(code, codes) }));
  };

  if (annotationCodes.length === 1) setCurrent(annotationCodes[0]);

  return (
    <ButtonSelection
      key={"currentCodePageButtons"}
      active={true}
      options={getOptions(annotationCodes)}
      canDelete={false}
      callback={onButtonSelect}
    />
  );
};

const NewCodePage = ({
  codeHistory,
  codingjob,
  codes,
  settings,
  annotations,
  current,
  setCurrent,
}) => {
  const textInputRef = useRef(null);
  const dispatch = useDispatch();
  const [focusOnButtons, setFocusOnButtons] = useState(true);

  const onKeydown = React.useCallback(
    (event) => {
      const focusOnTextInput = textInputRef?.current?.children[0] === document.activeElement;
      if (!focusOnTextInput) setFocusOnButtons(true);

      console.log(textInputRef.current);
      if (arrowKeys.includes(event.key)) return null;
      if (event.keyCode === 32 || event.keyCode === 13) return null;
      textInputRef.current.click();
      setFocusOnButtons(false);
    },
    [textInputRef]
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

  const getOptions = (codeHistory) => {
    return codeHistory.map((code) => ({ label: code, color: getColor(code, codes) }));
  };

  return (
    <>
      <div>
        <h5>Set new code:</h5>
        <Ref innerRef={textInputRef}>
          <Dropdown
            placeholder={"Search"}
            style={{ minWidth: "10em" }}
            options={codes.map((code) => {
              return {
                key: code.code,
                value: code.code,
                text: code.code,
              };
            })}
            search
            selection
            selectOnNavigation={false}
            minCharacters={0}
            autoComplete={"on"}
            additionPosition="bottom"
            allowAdditions={settings.canAddCodes}
            additionLabel={<i style={{ color: "red" }}>Create new code: </i>}
            onAddItem={(e, d) => addCode(d.value, codes, codingjob, dispatch)}
            onChange={(e, d) =>
              updateAnnotations(annotations, current, d.value, setCurrent, dispatch)
            }
          />
        </Ref>
      </div>
      <br />
      <ButtonSelection
        key={"newCodePageButtons"}
        active={focusOnButtons}
        options={getOptions(codeHistory)}
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
    <>
      {mapButtons()}
      {deleteButton()}
    </>
  );
};

const addCode = (code, codes, codingjob, dispatch) => {
  console.log(codes);
  if (!codes.find((e) => e.code === code)) {
    const newcodes = [...codes, { code }];
    db.writeCodes(codingjob, newcodes);
    dispatch(setCodes(newcodes));
  }
};

const updateAnnotations = (annotations, current, value, setCurrent, dispatch) => {
  if (!annotations) return null;

  let ann = {
    index: annotations[current].index,
    group: current,
    offset: annotations[current].offset,
    length: annotations[current].length,
    span: annotations[current].span,
  };

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

  if (Object.keys(annotations).includes(null)) {
    setCurrent(null);
  } else {
    setCurrent(value);
  }

  dispatch(triggerCodeselector(null, null, null));
};

const getColor = (tokenCode, codes) => {
  const codematch = codes.find((code) => code.code === tokenCode);
  if (codematch) {
    return codematch.color;
  } else {
    return "lightgrey";
  }
};

export default CodeSelector;
