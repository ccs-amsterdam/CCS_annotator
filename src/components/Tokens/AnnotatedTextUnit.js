import React from "react";
import { Popup, List } from "semantic-ui-react";
import { useDispatch, useSelector } from "react-redux";
import { getColor, getColorGradient } from "util/tokenDesign";
import CodeSelector from "./CodeSelector";
import { toggleAnnotation, triggerCodeselector } from "actions";

const AnnotatedTextUnit = ({ unit, index, children, style }) => {
  const codeMap = useSelector((state) => state.codeMap);
  const annotations = useSelector((state) => state.annotations[unit][index]);
  const dispatch = useDispatch();

  const csTrigger = useSelector((state) => {
    if (state.codeSelectorTrigger.unit !== unit) return null;
    if (state.codeSelectorTrigger.index !== index) return null;
    return state.codeSelectorTrigger;
  });

  let color = "white";
  let codes;
  let colors;
  if (annotations) {
    codes = Object.keys(annotations);
    colors = codes.map((code) => getColor(code, codeMap));
    color = getColorGradient(colors, codeMap);
  }

  const buttonToken = () => {
    return (
      <span
        onClick={(e) => {
          e.preventDefault();
          dispatch(toggleAnnotation(unit, index, "UNASSIGNED", { index: index }));
          dispatch(triggerCodeselector(null, null, null, null));
          dispatch(triggerCodeselector("new_selection", unit, index, null));
        }}
        onContextMenu={(e) => {
          e.preventDefault();
          if (!annotations) return;
          dispatch(triggerCodeselector("right_click", unit, index, null));
        }}
        style={{
          ...style,
          cursor: "pointer",
          background: annotations ? color : "white",
        }}
      >
        {children}
      </span>
    );
  };

  if (annotations) {
    if (csTrigger) {
      return (
        <CodeSelector
          annotations={annotations}
          unit={unit}
          current={csTrigger.code}
          newSelection={csTrigger.from === "new_selection"}
        >
          {buttonToken()}
        </CodeSelector>
      );
    } else {
      return (
        <Popup
          trigger={buttonToken()}
          position="left center"
          style={{ padding: "0.3em", paddingBottom: "0.5em" }}
        >
          <List>
            {codes.map((code, i) => (
              <List.Item key={i} style={{ backgroundColor: colors[i], padding: "0.3em" }}>
                {code}
              </List.Item>
            ))}
          </List>
        </Popup>
      );
    }
  }
  return buttonToken();
};

export default React.memo(AnnotatedTextUnit);
