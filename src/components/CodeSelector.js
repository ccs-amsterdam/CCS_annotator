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

const CodeSelector = React.memo(
  ({ index, children, annotations, csTrigger }) => {
    const codes = useSelector((state) => state.codes);
    const codingjob = useSelector((state) => state.codingjob);
    const settings = useSelector((state) => state.codingjobSettings);
    const codeHistory = useSelector((state) => state.codeHistory);

    const textInputRef = useRef(null);
    const [current, setCurrent] = useState(null);
    const [hasOpened, setHasOpened] = useState(false);
    const [popupPage, setPopupPage] = useState(0);
    const [selectedCodeButton, setSelectedCodeButton] = useState(0);
    const [nButtons, setNButtons] = useState(Object.keys(annotations).length);

    // Placeholder: should be managed in state
    const dispatch = useDispatch();

    useEffect(() => {
      if (!annotations) return;
      if (current) return null;

      if (annotations && annotations !== undefined) {
        if (Object.keys(annotations).includes("Not yet assigned")) {
          setCurrent("Not yet assigned");
        } else {
          setCurrent(Object.keys(annotations)[0]);
        }
      }
    }, [current, setCurrent, index, annotations]);

    const onKeydown = React.useCallback(
      // all keydown events
      // main events are either selecting one of the code buttons, for either choosing the old or new code
      // and moving focus to the dropdown/search input on text input
      (event) => {
        // any arrowkey
        if (arrowKeys.includes(event.key)) {
          if (textInputRef?.current?.children[0] === document.activeElement)
            return;

          if (event.key === "ArrowRight") {
            if (!nButtons) return;
            if (selectedCodeButton < nButtons - 1)
              setSelectedCodeButton(selectedCodeButton + 1);
          }

          if (event.key === "ArrowLeft" && selectedCodeButton > 0) {
            setSelectedCodeButton(selectedCodeButton - 1);
          }
          return;
        }

        // space or enter
        if (event.keyCode === 32 || event.keyCode === 13) {
          const showCurrentCodeSelection =
            popupPage === 0 &&
            Object.keys(annotations).length > 1 &&
            csTrigger !== "new_selection";

          if (showCurrentCodeSelection) {
            const codebuttons = Object.keys(annotations);
            setPopupPage(1);
            setCurrent(codebuttons[selectedCodeButton]);
          } else {
            const codebuttons = codeHistory.filter(
              (e) => e !== current && e !== "Not yet assigned"
            );

            let value = current;
            if (selectedCodeButton < codebuttons.length)
              value = codebuttons[selectedCodeButton];
            updateAnnotations(
              annotations,
              current,
              value,
              setCurrent,
              dispatch
            );
          }
          return;
        }

        // All previous key catches
        if (textInputRef.current) textInputRef.current.click();
      },
      [
        annotations,
        current,
        nButtons,
        popupPage,
        csTrigger,
        dispatch,
        codeHistory,
        selectedCodeButton,
      ]
    );

    useEffect(() => {
      window.addEventListener("keydown", onKeydown);
      dispatch(blockEvents(true));

      return () => {
        window.removeEventListener("keydown", onKeydown);
        dispatch(blockEvents(false));
      };
    }, [onKeydown, dispatch]);

    const createPopupPage = (popupPage) => {
      const annotationCodes = Object.keys(annotations);

      const showCurrentCodeSelection =
        popupPage === 0 &&
        annotationCodes.length > 1 &&
        csTrigger !== "new_selection";

      if (showCurrentCodeSelection) {
        return (
          <>
            <h5>Select current code:</h5>

            {annotationCodes.map((code, i) => {
              return (
                <Button
                  style={{ backgroundColor: getColor(code, codes) }}
                  compact
                  size={i === selectedCodeButton ? "medium" : "mini"}
                  onMouseOver={() => setSelectedCodeButton(i)}
                  onClick={() => {
                    setPopupPage(1);
                    setCurrent(code);
                    //selectSpan(annotations, code, dispatch);
                  }}
                >
                  {code}
                </Button>
              );
            })}
          </>
        );
      }

      return (
        <>
          <div>
            <h5 style={{ display: "inline" }}>Set new code:</h5>
            <Ref innerRef={textInputRef}>
              <Dropdown
                placeholder={"Search"}
                style={{ marginLeft: "2em", minWidth: "10em" }}
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
                additionLabel={
                  <i style={{ color: "red" }}>Create new code: </i>
                }
                onAddItem={(e, d) =>
                  addCode(d.value, codes, codingjob, dispatch)
                }
                onChange={(e, d) =>
                  updateAnnotations(
                    annotations,
                    current,
                    d.value,
                    setCurrent,
                    dispatch
                  )
                }
              />
            </Ref>
          </div>
          <br />
          <CodeButtons
            annotations={annotations}
            current={current}
            codes={codes}
            setCurrent={setCurrent}
            codeHistory={codeHistory}
            selectedCodeButton={selectedCodeButton}
            setSelectedCodeButton={setSelectedCodeButton}
            setNButtons={setNButtons}
          />
          &nbsp;&nbsp;
        </>
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
          if (hasOpened && csTrigger)
            // calling dispatch directly causes a memory leak warning, because it unmounts
            // the component. The very minor async timeout fixes this.
            setTimeout(() => dispatch(triggerCodeselector(null)), 10);
        }}
        position="top left"
      >
        {createPopupPage(popupPage)}
      </Popup>
    );
  }
);

const CodeButtons = ({
  annotations,
  current,
  codes,
  setCurrent,
  codeHistory,
  selectedCodeButton,
  setSelectedCodeButton,
  setNButtons,
}) => {
  const dispatch = useDispatch();

  const codeHistoryValid = codeHistory.filter(
    (e) => e !== current && e !== "Not yet assigned"
  );
  setNButtons(codeHistoryValid.length + 1); // also the delete button

  const newCodeButtons = () => {
    return codeHistoryValid.map((code, i) => {
      return (
        <Button
          style={{ backgroundColor: getColor(code, codes) }}
          key={code}
          value={code}
          compact
          size={i === selectedCodeButton ? "medium" : "mini"}
          onMouseOver={() => setSelectedCodeButton(i)}
          onClick={(e, d) => {
            console.log(annotations);
            console.log(d.value);
            updateAnnotations(
              annotations,
              current,
              d.value,
              setCurrent,
              dispatch
            );
          }}
        >
          {code}
        </Button>
      );
    });
  };

  return (
    <>
      {newCodeButtons()}

      <Button
        icon="delete"
        size={
          selectedCodeButton === codeHistoryValid.length ? "medium" : "mini"
        }
        compact
        color="red"
        onMouseOver={() => setSelectedCodeButton(codeHistoryValid.length)}
        onClick={(e, d) =>
          updateAnnotations(annotations, current, current, setCurrent, dispatch)
        }
      />
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

const updateAnnotations = (
  annotations,
  current,
  value,
  setCurrent,
  dispatch
) => {
  const key = current;
  let annotation = annotations;
  if (!annotation) return null;

  console.log(current);

  let ann = {
    index: annotation[key].index,
    group: key,
    offset: annotation[key].offset,
    length: annotation[key].length,
    span: annotation[key].span,
  };

  let oldAnnotation = { ...ann };
  oldAnnotation.span = [oldAnnotation.index, oldAnnotation.index];
  dispatch(rmAnnotations([oldAnnotation]));

  if (value === key) {
    dispatch(triggerCodeselector(null, null));
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

  if (Object.keys(annotation).includes(null)) {
    setCurrent(null);
  } else {
    setCurrent(value);
  }

  dispatch(triggerCodeselector(null, null));
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
