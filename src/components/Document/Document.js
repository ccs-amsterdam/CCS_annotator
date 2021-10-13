import React, { useState, useEffect } from "react";
import AnnotateNavigation from "./subcomponents/AnnotateNavigation";
import Tokens from "./subcomponents/Tokens";
import useCodeSelector from "./subcomponents/useCodeSelector";
import { useSelector } from "react-redux";
import { exportAnnotations } from "util/annotations";
import useUnit from "./subcomponents/useUnit";
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
 * @param {*} returnAnnotations A function for saving annotations which, if given, should be the
 *                           connected to annotation
 *                           (like const [annotations, setAnnotations] = useState({})).
 *                           If not given, users cannot make annotations
 * @param {*} setReady       A function for passing a boolean to the parent to indicate that the
 *                           text is ready (which is usefull if the parent wants to transition
 *                           to new texts nicely)
 * @returns
 */
const Document = ({ unit, codes, settings, returnAnnotations, returnTokens, setReady }) => {
  const fullScreenNode = useSelector(state => state.fullScreenNode);

  const [tokensReady, setTokensReady] = useState(0);
  const [tokens, annotations, setAnnotations] = useUnit(unit, returnTokens);
  const [popup, triggerCodePopup, codeMap, codeSelectorOpen] = useCodeSelector(
    tokens,
    codes,
    settings,
    annotations,
    setAnnotations,
    fullScreenNode
  );

  useEffect(() => {
    if (returnAnnotations && annotations) returnAnnotations(exportAnnotations(annotations));
  }, [annotations, returnAnnotations]);

  useEffect(() => {
    if (setReady) setReady(current => current + 1);
    setAnnotations(state => ({ ...state })); //trigger DOM update after token refs have been prepared
  }, [tokensReady, setAnnotations, setReady]);

  if (!tokens) return null;

  return (
    <>
      <Tokens tokens={tokens} centerVertical={settings.centerVertical} setReady={setTokensReady} />
      <AnnotateNavigation
        tokens={tokens}
        codeMap={codeMap}
        annotations={annotations}
        triggerCodePopup={triggerCodePopup}
        eventsBlocked={codeSelectorOpen}
        fullScreenNode={fullScreenNode}
        disableAnnotations={!returnAnnotations || !codeMap}
      />

      {popup || null}
    </>
  );
};

export default React.memo(Document);
