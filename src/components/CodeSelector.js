import React, { useState, useEffect, useRef } from "react";
import { useSelector, useDispatch } from "react-redux";
import { Button, Dropdown, Popup, Ref } from "semantic-ui-react";
import {
  appendCodeHistory,
  toggleAnnotations,
  rmAnnotations,
  blockEvents,
  triggerCodeselector,
} from "../actions";

const arrowKeys = ["ArrowRight", "ArrowLeft", "ArrowUp", "ArrowDown"];

const CodeSelector = React.memo(
  ({ index, children, annotations, csTrigger }) => {
    const codes = useSelector((state) => state.codes);
    const codeHistory = useSelector((state) => state.codeHistory);

    const textInputRef = useRef(null);
    const [current, setCurrent] = useState(null);
    const [hasOpened, setHasOpened] = useState(false);
    const [popupPage, setPopupPage] = useState(0);

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

    useEffect(() => {
      window.addEventListener("keydown", onKeydown);
      dispatch(blockEvents(true));

      return () => {
        window.removeEventListener("keydown", onKeydown);
        dispatch(blockEvents(false));
      };
    }, [dispatch]);

    const onKeydown = (event) => {
      if (!arrowKeys.includes(event.key)) {
        if (textInputRef.current) textInputRef.current.click();
      }
    };

    const createPopupPage = (popupPage) => {
      //if (Object.keys(annotations).length === 1) setPopupPage(1);
      const annotationCodes = Object.keys(annotations);

      const select_first =
        popupPage === 0 &&
        annotationCodes.length > 1 &&
        csTrigger !== "new_selection";

      console.log(popupPage);

      if (select_first)
        return (
          <>
            <h5>Select current code:</h5>
            <Button.Group compact>
              {annotationCodes.map((code) => {
                return (
                  <Button
                    style={{ backgroundColor: getColor(code, codes) }}
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
            </Button.Group>
          </>
        );

      //if (annotationCodes.length === 1)
      //  selectSpan(annotations, annotationCodes[0], dispatch);

      return (
        <>
          <h5>Set new code:</h5>
          <Button.Group compact>
            {newCodeButtons(
              annotations,
              codeHistory,
              current,
              codes,
              setCurrent,
              dispatch
            )}
            <Button
              icon="delete"
              size="mini"
              color="red"
              onClick={(e, d) =>
                updateAnnotations(
                  annotations,
                  current,
                  current,
                  setCurrent,
                  dispatch
                )
              }
            />
          </Button.Group>
          &nbsp;&nbsp;
          <Ref innerRef={textInputRef}>
            <Dropdown
              placeholder={"Search"}
              options={codes.map((code) => {
                return { key: code.code, value: code.code, text: code.code };
              })}
              search
              selection
              selectOnNavigation={false}
              minCharacters={0}
              autoComplete={"on"}
              searchInput={{ autoFocus: false }}
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

// const selectSpan = (annotations, code, dispatch) => {
//   const span = annotations[code].span;
//   let add = false;
//   for (let index = span[0]; index <= span[1]; index++) {
//     dispatch(setTokenSelection(index, add));
//     add = true;
//   }
// };

// const getCurrentOptions = (annotations, current, setCurrent) => {
//   let annotation = annotations;
//   // if (!Object.keys(annotation).includes(current)) {
//   //   current = null;
//   //   setCurrent(current);
//   // }
//   if (annotation) {
//     return Object.keys(annotation)
//       .filter((e) => e !== current)
//       .map(ddOptions);
//   } else {
//     return [ddOptions(null)];
//   }
// };

// const ddOptions = (value) => {
//   let useValue = value;
//   if (!value || value === "null") useValue = "Not yet assigned";
//   return { key: useValue, text: useValue, value: useValue };
// };

const newCodeButtons = (
  annotations,
  codeHistory,
  current,
  codes,
  setCurrent,
  dispatch
) => {
  return codeHistory
    .filter((e) => e !== current && e !== "Not yet assigned")
    .map((code) => {
      return (
        <Button
          style={{ backgroundColor: getColor(code, codes) }}
          key={code}
          value={code}
          onClick={(e, d) =>
            updateAnnotations(
              annotations,
              current,
              d.value,
              setCurrent,
              dispatch
            )
          }
        >
          {code}
        </Button>
      );
    });
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
