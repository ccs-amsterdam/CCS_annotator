import React from "react";
import { Button } from "semantic-ui-react";

import { useDispatch, useSelector } from "react-redux";
import { getColor, getColorGradient } from "util/tokenDesign";
import CodeSelector from "./CodeSelector";
import { toggleAnnotation, triggerCodeselector } from "actions";

const AnnotatedTextUnit = ({ unit, index, symbol, style }) => {
  const codeMap = useSelector((state) => state.codeMap);
  const annotations = useSelector((state) => state.annotations[unit][index]);
  const dispatch = useDispatch();

  const csTrigger = useSelector((state) => {
    if (state.codeSelectorTrigger.unit !== unit) return null;
    if (state.codeSelectorTrigger.index !== index) return null;
    return state.codeSelectorTrigger;
  });

  let color = "white";
  if (annotations) {
    const codes = Object.keys(annotations);
    const colors = codes.map((code) => getColor(code, codeMap));
    color = getColorGradient(colors, codeMap);
  }

  const buttonToken = () => {
    return (
      <Button
        onClick={() => {
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
          background: annotations ? color : "white",
        }}
      >
        {symbol}
      </Button>
    );
  };

  if (csTrigger && annotations) {
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
  } else return buttonToken();
};

export default React.memo(AnnotatedTextUnit);
