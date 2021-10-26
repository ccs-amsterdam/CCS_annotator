import React, { useState, useEffect, useRef } from "react";
import AnnotateNavigation from "./subcomponents/AnnotateNavigation";
import Tokens from "./subcomponents/Tokens";
import useCodeSelector from "./subcomponents/useCodeSelector";
import { useSelector } from "react-redux";
import { exportSpanAnnotations } from "util/annotations";
import useUnit from "./subcomponents/useUnit";
import hash from "object-hash";
import SelectVariable from "./subcomponents/SelectVariable";

/**
 * This is hopefully the only Component in this folder that you'll ever see. It should be fairly isolated
 * and easy to use, but behind the scenes it gets dark real fast.
 * @param {*} tokens An array with token objects, as created with importTokens or parseTokens
 * @param {*} codes    An array of codes, or an array of objects in which codes can have
 *                     more cool stuff (color, parent, tree). If not given, texts will be
 *                     shown, but users cannot make annotations.
 * @param {*} settings An object with settings. Currently supports:
 *                     - centerVertical: true/false      whether text is centered verticall
 *                     - buttonMode: "all"/"recent"      show all or only recent selected options as button
 *                     - rowSize: number                 number of buttons per row
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

  const [tokensReady, setTokensReady] = useState(0);
  const [tokens, annotations, setAnnotations] = useUnit(unit, safetyCheck, returnTokens);
  const [popup, triggerCodePopup, variableMap, codeSelectorOpen] = useCodeSelector(
    tokens,
    variables,
    variable,
    annotations,
    setAnnotations,
    fullScreenNode
  );

  useEffect(() => {
    if (!annotations) return;

    // check if same unit, to prevent annotations from spilling over due to race conditions
    if (safetyCheck.current.tokens !== tokens) return;
    // check if annotations changed since start.
    if (!safetyCheck.current.annotationsChanged) {
      if (safetyCheck.current.annotations === hash(annotations)) return;
      safetyCheck.current.annotationsChanged = true;
    }

    onChangeAnnotations(exportSpanAnnotations(annotations, tokens));
  }, [tokens, annotations, onChangeAnnotations]);

  useEffect(() => {
    if (setReady) setReady((current) => current + 1);
    setAnnotations((state) => ({ ...state })); //trigger DOM update after token refs have been prepared
  }, [tokensReady, setAnnotations, setReady]);

  if (!tokens) return null;

  return (
    <>
      <SelectVariable
        variables={variables}
        variable={variable}
        setVariable={setVariable}
        height={"30px"}
      />
      <Tokens
        tokens={tokens}
        centerVertical={settings.centerVertical}
        setReady={setTokensReady}
        height={variables && variables.length > 1 ? "calc(100% - 30px)" : "100%"}
      />
      <AnnotateNavigation
        tokens={tokens}
        variableMap={variableMap}
        annotations={annotations}
        triggerCodePopup={triggerCodePopup}
        eventsBlocked={codeSelectorOpen || blockEvents}
        fullScreenNode={fullScreenNode}
        disableAnnotations={!onChangeAnnotations || !variableMap}
      />

      {popup || null}
    </>
  );
};

export default React.memo(Document);
