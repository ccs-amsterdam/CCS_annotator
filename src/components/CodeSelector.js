import React, { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { Button, Dropdown, Popup, Step } from "semantic-ui-react";
import {
  setCodes,
  appendCodeHistory,
  toggleAnnotations,
  rmAnnotations,
} from "../Actions";
import randomColor from "randomcolor";

const CodeSelector = (props) => {
  const codes = useSelector((state) => state.codes);
  const codeHistory = useSelector((state) => state.codeHistory);
  const spanAnnotations = useSelector((state) => state.spanAnnotations);
  const [current, setCurrent] = useState(null);

  const dispatch = useDispatch();

  useEffect(() => {
    let annotation = spanAnnotations[props.index];
    if (annotation && annotation !== undefined) {
      if (Object.keys(annotation).includes("Not yet assigned")) {
        setCurrent("Not yet assigned");
      } else {
        setCurrent(Object.keys(annotation)[0]);
      }
    }
  }, [props.index, spanAnnotations]);

  // useEffect(() => {
  //   if (!current || current === "undefined" || current === "null") {
  //     if (codeHistory.length > 0) {
  //       updateAnnotations(codeHistory[0]);
  //     }
  //   }
  // }, [current, codeHistory, props.annotation]);

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

    let annotation = spanAnnotations[props.index];
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
    let annotation = spanAnnotations[props.index];
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
      trigger={props.children}
      flowing
      hoverable
      wide
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
                <Dropdown
                  options={codes}
                  placeholder="Search or add new"
                  search
                  selection
                  allowAdditions
                  onAddItem={onAddition}
                  onChange={(e, d) => updateAnnotations(d.value)}
                />
              </Step.Description>
            </Step.Content>
          </Step>
        </Step.Group>
      </div>
    </Popup>
  );
};

export default CodeSelector;
