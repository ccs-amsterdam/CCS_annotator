import React, { useState, useEffect, useRef } from "react";
import { useSelector, useDispatch } from "react-redux";
import { Button, Dropdown, Popup, Ref, Step } from "semantic-ui-react";
import {
  setCodes,
  appendCodeHistory,
  toggleAnnotations,
  rmAnnotations,
} from "../Actions";
import randomColor from "randomcolor";

const CodeSelector = ({ index, children }) => {
  const codes = useSelector((state) => state.codes);
  const codeHistory = useSelector((state) => state.codeHistory);
  const spanAnnotations = useSelector((state) => state.spanAnnotations);
  const textInputRef = useRef(null);
  const [current, setCurrent] = useState(null);

  // Placeholder: should be managed in state
  const userAccess = { editable: true };
  const dispatch = useDispatch();

  useEffect(() => {
    let annotation = spanAnnotations[index];
    if (annotation && annotation !== undefined) {
      if (Object.keys(annotation).includes("Not yet assigned")) {
        setCurrent("Not yet assigned");
      } else {
        setCurrent(Object.keys(annotation)[0]);
      }
    }
  }, [index, spanAnnotations]);

  const toggleListener = (on) => {
    if (on) {
      window.addEventListener("keydown", onKeydown);
    } else {
      window.removeEventListener("keydown", onKeydown);
    }
  };
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

  const getColor = (tokenCode, codes) => {
    const codematch = codes.find((e) => e.value === tokenCode);
    if (codematch) {
      return codematch.color;
    } else {
      return "lightgrey";
    }
  };

  const updateAnnotations = (value) => {
    const key = current;

    let annotation = spanAnnotations[index];
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

    if (value === key) return null;

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
  };

  const newCodeButtons = () => {
    return codeHistory
      .filter((e) => e !== current && e !== "Not yet assigned")
      .map((code) => {
        return (
          <Button
            style={{ backgroundColor: getColor(code, codes) }}
            key={code}
            value={code}
            onClick={(e, d) => updateAnnotations(d.value)}
          >
            {code}
          </Button>
        );
      });
  };

  const ddOptions = (value) => {
    let useValue = value;
    if (!value || value === "null") useValue = "Not yet assigned";
    return { key: useValue, text: useValue, value: useValue };
  };

  const getCurrentOptions = () => {
    let annotation = spanAnnotations[index];
    if (annotation) {
      return Object.keys(annotation)
        .filter((e) => e !== current)
        .map(ddOptions);
    } else {
      return ddOptions(null);
    }
  };

  return (
    <Popup
      trigger={children}
      on="hover"
      flowing
      hoverable
      wide
      onOpen={() => toggleListener(true)}
      onClose={() => toggleListener(false)}
      position="top center"
    >
      <div>
        <Step.Group>
          <Step active>
            <Step.Content>
              <Step.Title>Current code</Step.Title>
              <Step.Description>
                <Button.Group>
                  <Button
                    tiny
                    icon="trash"
                    size="mini"
                    onClick={(e, d) => updateAnnotations(current)}
                  />
                  <Button style={{ backgroundColor: getColor(current, codes) }}>
                    <Dropdown
                      text={current}
                      options={getCurrentOptions()}
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
                <Button.Group widths="1">{newCodeButtons()}</Button.Group>
                &nbsp;&nbsp;
                <Ref innerRef={textInputRef}>
                  <Dropdown
                    options={codes}
                    placeholder={
                      userAccess.editable
                        ? "Search or add new code"
                        : "Search code"
                    }
                    search
                    selection
                    allowAdditions={userAccess.editable}
                    additionPosition={"bottom"}
                    onAddItem={onAddition}
                    fullTextSearch={true}
                    showOnFocus={false}
                    selectOnNavigation={false}
                    minCharacters={"1"}
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

export default CodeSelector;
