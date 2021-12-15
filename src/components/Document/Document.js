import React, { useState, useEffect, useRef } from "react";
import AnnotateNavigation from "./subcomponents/AnnotateNavigation";
import Tokens from "./subcomponents/Tokens";
import useCodeSelector from "./subcomponents/useCodeSelector";
import { useSelector } from "react-redux";
import { exportSpanAnnotations } from "library/annotations";
import useUnit from "./subcomponents/useUnit";
import hash from "object-hash";
import SelectVariable from "./subcomponents/SelectVariable";

import "components/Document/documentStyle.css";

/**
 * This is hopefully the only Component in this folder that you'll ever see. It should be fairly isolated
 * and easy to use, but behind the scenes it gets dark real fast.
 * @param {*} unit     A unit object, as created in JobServerClass (or standardizeUnit)
 * @param {*} variables An object with variables, where each variable is an array of codes
 * @param {*} settings An object with settings. Supports "editMode" (and probably more to come)
 * @param {*} onChangeAnnotations An optional function for saving annotations.
 *                              If not given, users cannot make annotations
 * @param {*} returnTokens   An optional function for getting access to the tokens array
 * @param {*} setReady       A function for passing a boolean to the parent to indicate that the
 *                           text is ready (which is usefull if the parent wants to transition
 *                           to new texts nicely)
 * @param {*} blockEvents    boolean. If true, disable event listeners
 * @returns
 */
const Document = ({
  unit,
  variables, //codes,
  settings,
  onChangeAnnotations,
  returnTokens,
  setReady,
  blockEvents,
}) => {
  const fullScreenNode = useSelector((state) => state.fullScreenNode);
  const safetyCheck = useRef(null); // ensures only new annotations for the current unit are passed to onChangeAnnotations
  const [variable, setVariable] = useState(null);
  const [codeHistory, setCodeHistory] = useState({});

  const [tokensReady, setTokensReady] = useState(0);
  const [preparedUnit, annotations, setAnnotations] = useUnit(
    unit,
    safetyCheck,
    returnTokens,
    setCodeHistory
  );
  const [codeSelector, triggerCodeSelector, variableMap, codeSelectorOpen] = useCodeSelector(
    preparedUnit.tokens,
    variables,
    variable,
    annotations,
    setAnnotations,
    codeHistory,
    setCodeHistory,
    fullScreenNode,
    settings?.editMode || variable === "EDIT ALL"
  );

  useEffect(() => {
    if (!annotations || !onChangeAnnotations) return;

    // check if same unit, to prevent annotations from spilling over due to race conditions
    if (safetyCheck.current.tokens !== preparedUnit.tokens) return;

    //check if annotations changed since start.
    if (!safetyCheck.current.annotationsChanged) {
      if (safetyCheck.current.annotations === hash(annotations)) return;
      safetyCheck.current.annotationsChanged = true;
    }

    onChangeAnnotations(exportSpanAnnotations(annotations, preparedUnit.tokens, true));
  }, [preparedUnit.tokens, annotations, onChangeAnnotations]);

  useEffect(() => {
    if (setReady) setReady((current) => current + 1);
    setAnnotations((state) => ({ ...state })); //trigger DOM update after token refs have been prepared
  }, [tokensReady, setAnnotations, setReady]);

  if (!preparedUnit.tokens) return null;
  return (
    <div style={{ display: "flex", height: "100%", maxHeight: "100%", flexDirection: "column" }}>
      <Tokens
        tokens={preparedUnit.tokens}
        text_fields={preparedUnit.text_fields}
        meta_fields={preparedUnit.meta_fields}
        setReady={setTokensReady}
        maxHeight={variables && variables.length > 1 ? "calc(100% - 60px)" : "calc(100% - 30px)"}
        editMode={settings.editMode}
      />

      <SelectVariable
        variables={variables}
        variable={variable}
        setVariable={setVariable}
        minHeight={variables && variables.length > 1 ? 60 : 30} //'px'
      />
      <AnnotateNavigation
        tokens={preparedUnit.tokens}
        variableMap={variableMap}
        annotations={annotations}
        disableAnnotations={!onChangeAnnotations || !variableMap}
        editMode={settings?.editMode || variable === "EDIT ALL"}
        triggerCodeSelector={triggerCodeSelector}
        eventsBlocked={codeSelectorOpen || blockEvents}
        fullScreenNode={fullScreenNode}
      />
      {codeSelector || null}
    </div>
  );
};

export default React.memo(Document);
