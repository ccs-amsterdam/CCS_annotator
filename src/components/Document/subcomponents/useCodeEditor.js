import React, { useState, useEffect } from "react";
import { Popup, ButtonGroup, Button } from "semantic-ui-react";

/**
 * Extends useCodeSelector. Uses the same trigger, but instead of directly opening the
 * code editor, it first opens a selection for which span to use. This restricts codeSelector to only
 * working with existing annotations (hence 'edit')
 * @param {} tokens
 * @param {*} triggerCodeSelector
 * @returns
 */
const useCodeEditor = (tokens, annotations, variableMap, triggerCodeSelector) => {
  // Given annotations, looks up all spans used.
  // if only one unique span exists, directly triggers code popup
  // if not, first open selection between spans
  const [spans, setSpans] = useState({});

  useEffect(() => {
    if (Object.keys(spans).length !== 1) return;
    const span = Object.values(spans)[0];
    triggerCodeSelector(span.index, span.selection);
    setSpans({});
  }, [spans, setSpans, triggerCodeSelector]);

  const triggerFunction = (index, selection) => {
    // create an array of spans, where key is the text, and
    const spans = {};
    for (let i = selection.span[0]; i <= selection.span[1]; i++) {
      if (!annotations[i]) continue;
      for (let id of Object.keys(annotations[i])) {
        const annotation = annotations[i][id];
        if (!variableMap[annotation.variable]) continue;

        const span = annotation.span;
        const spankey = span[0] + "-" + span[1];
        const text = tokens
          .slice(span[0], span[1] + 1)
          .map((t) => t.pre + t.text + t.post)
          .join("");
        if (!spans[spankey]) spans[spankey] = { index, text, selection: annotation };
      }
    }

    setSpans(spans);
  };

  // const onKeydown = React.useCallback(
  //   (event) => {
  //     const nbuttons = Object.keys(spans).length;
  //     // any arrowkey
  //     if (arrowKeys.includes(event.key)) {
  //       event.preventDefault();
  //       if (event.key === "ArrowDown") {
  //         setSelected(moveDown(allOptions, selected));
  //       }
  //       if (event.key === "ArrowUp") {
  //         setSelected(moveUp(allOptions, selected));
  //       }

  //       return;
  //     }

  //     // delete
  //     if (event.keyCode === 46) callback(null);

  //     // space or enter
  //     if (event.keyCode === 32 || event.keyCode === 13) {
  //       event.preventDefault();
  //       event.stopPropagation();

  //       let value = allOptions[selected].value;
  //       if (allOptions[selected].box2) {
  //         onClickDelete(value);
  //       } else {
  //         onClickSelect(value);
  //       }
  //     }
  //   },
  //   [selected, callback, allOptions, onClickDelete, onClickSelect]
  // );

  // useEffect(() => {
  //     window.addEventListener("keydown", onKeydown);
  //   return () => {
  //     window.removeEventListener("keydown", onKeydown);
  //   };
  // }, [active, onKeydown]);

  const getPopup = () => {
    if (!spans) return null;
    const nspans = Object.keys(spans).length;
    if (nspans === 0) return null;
    //if (nspans === 1)

    const token = tokens[Object.values(spans)[0].index];
    if (!token?.ref?.current) return null;
    //const test = { "lalala test this": true, "and thiss moweofijoef": true };

    return (
      <Popup
        basic
        position="top left"
        style={{ margin: "4px", padding: "0px", border: "0px solid" }}
        open={Object.keys(spans).length > 0}
        onClose={() => setSpans({})}
        context={token.ref}
      >
        <ButtonGroup vertical>
          {Object.keys(spans).map((key) => {
            return (
              <Button
                key={key}
                secondary
                style={{ padding: "5px" }}
                onClick={() => setSpans({ [key]: spans[key] })}
              >
                {spans[key].text}
              </Button>
            );
          })}
        </ButtonGroup>
      </Popup>
    );
  };

  // popup, trigger, open
  return [getPopup(), triggerFunction, Object.keys(spans).length > 0];
};

export default useCodeEditor;
