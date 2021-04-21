import React, { useState, useEffect, useRef } from "react";
import { useSelector, useDispatch } from "react-redux";
import { Button, Dropdown, Popup, Ref, Step } from "semantic-ui-react";
import {
  setCodes,
  appendCodeHistory,
  toggleAnnotations,
  rmAnnotations,
  blockEvents,
  triggerCodeselector,
} from "../actions";
import randomColor from "randomcolor";

const CodeSelector = ({ index, children }) => {
  const codes = useSelector((state) => state.codes);
  const codeHistory = useSelector((state) => state.codeHistory);
  const spanAnnotations = useSelector((state) => state.spanAnnotations[index]);
  const open = useSelector((state) => state.codeSelectorTrigger === index);

  const textInputRef = useRef(null);
  const [current, setCurrent] = useState(null);

  // Placeholder: should be managed in state
  const userAccess = { editable: true };
  const dispatch = useDispatch();

  // useEffect(() => {
  //   console.log("mount");
  //   return () => {
  //     console.log("unmount");
  //     setOpen(false);
  //   };
  // }, [setOpen]);

  useEffect(() => {
    if (current) return null;
    if (!spanAnnotations) return null;

    let annotation = spanAnnotations;
    if (annotation && annotation !== undefined) {
      if (Object.keys(annotation).includes("Not yet assigned")) {
        setCurrent("Not yet assigned");
      } else {
        setCurrent(Object.keys(annotation)[0]);
      }
    }
  }, [current, index, spanAnnotations]);

  useEffect(() => {
    if (open) {
      window.addEventListener("keydown", onKeydown);
      dispatch(blockEvents(true));
    } else {
      window.removeEventListener("keydown", onKeydown);
      dispatch(blockEvents(false));
    }
    return () => {
      window.removeEventListener("keydown", onKeydown);
      dispatch(blockEvents(false));
    };
  }, [open, dispatch]);

  const onKeydown = (event) => {
    if (textInputRef.current) textInputRef.current.click();
  };

  const onAddition = (e, d) => {
    dispatch(
      setCodes([
        {
          key: d.value,
          text: d.value,
          value: d.value,
          color: randomColor({ seed: d.value, luminosity: "bright" }),
        },
        ...codes,
      ])
    );
  };

  console.log(open);
  if (!open) return children;

  return (
    <Popup
      trigger={children}
      flowing
      hoverable
      wide
      open={open}
      mouseLeaveDelay={1000}
      position="top left"
    >
      <div>
        <Step.Group vertical>
          <Step active>
            <Step.Content>
              <Step.Title>Current code</Step.Title>
              <Step.Description>
                <Button.Group>
                  <Button
                    icon="trash"
                    size="mini"
                    onClick={(e, d) => updateAnnotations(current)}
                  />
                  <Button style={{ backgroundColor: getColor(current, codes) }}>
                    <Dropdown
                      text={current}
                      options={getCurrentOptions(spanAnnotations, current)}
                      value={current}
                      onChange={(e, d) => setCurrent(d.value)}
                    />
                  </Button>
                </Button.Group>
              </Step.Description>
            </Step.Content>
          </Step>

          <Step>
            <Step.Content>
              <Step.Title>Set new code</Step.Title>
              <Step.Description>
                <Button.Group vertical compact widths="1">
                  {newCodeButtons(
                    spanAnnotations,
                    codeHistory,
                    current,
                    codes,
                    setCurrent,
                    dispatch
                  )}
                </Button.Group>
                &nbsp;&nbsp;
                <Ref innerRef={textInputRef}>
                  <Dropdown
                    compact
                    options={codes}
                    placeholder={
                      userAccess.editable ? "Search or create " : "Search "
                    }
                    widths={1}
                    search
                    selection
                    allowAdditions={userAccess.editable}
                    additionPosition={"bottom"}
                    onAddItem={onAddition}
                    selectOnNavigation={false}
                    minCharacters={0}
                    autoComplete={"on"}
                    searchInput={{ autoFocus: false }}
                    onChange={(e, d) => updateAnnotations(d.value)}
                  />
                </Ref>
              </Step.Description>
            </Step.Content>
          </Step>
        </Step.Group>
      </div>
    </Popup>
  );
};

const getCurrentOptions = (spanAnnotations, current) => {
  let annotation = spanAnnotations;
  if (annotation) {
    return Object.keys(annotation)
      .filter((e) => e !== current)
      .map(ddOptions);
  } else {
    return [ddOptions(null)];
  }
};

const ddOptions = (value) => {
  let useValue = value;
  if (!value || value === "null") useValue = "Not yet assigned";
  return { key: useValue, text: useValue, value: useValue };
};

const newCodeButtons = (
  spanAnnotations,
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
            updateAnnotations(spanAnnotations, current, d.value, dispatch)
          }
        >
          {code}
        </Button>
      );
    });
};

const updateAnnotations = (
  spanAnnotations,
  current,
  value,
  setCurrent,
  dispatch
) => {
  const key = current;

  let annotation = spanAnnotations;
  if (!annotation) return null;

  let ann = {
    index: annotation[key].index,
    group: key,
    offset: annotation[key].offset,
    length: annotation[key].length,
    span: annotation[key].span,
  };

  // this is a nasty hack. Sort nice solution out later
  let oldAnnotation = { ...ann };
  oldAnnotation.span = [oldAnnotation.index, oldAnnotation.index];
  dispatch(rmAnnotations([oldAnnotation]));

  if (value === key) {
    dispatch(triggerCodeselector(null));
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

  dispatch(triggerCodeselector(null));
};

const getColor = (tokenCode, codes) => {
  const codematch = codes.find((e) => e.value === tokenCode);
  if (codematch) {
    return codematch.color;
  } else {
    return "lightgrey";
  }
};

export default CodeSelector;
