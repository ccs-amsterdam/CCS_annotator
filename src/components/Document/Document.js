import React, { useState, useEffect } from "react";
import AnnotateNavigation from "./subcomponents/AnnotateNavigation";
import Tokens from "./subcomponents/Tokens";
import useCodeSelector from "./subcomponents/useCodeSelector";

/**
 * This is hopefully the only Component in this folder that you'll ever see. It should be fairly isolated
 * and easy to use, but behind the scenes it gets dark real fast.
 * @param {*} tokens An array with token objects, as created with importTokens or parseTokens
 * @param {*} codebook A codebook that has (at least) a codebook.codes (or a codebook.codeMap, but if not this gets created from codes).
 *                     codebook.codes is either a simple array of codes, or an array of objects in which
 *                     codes can have more cool stuff (specific color, parents). If not given, texts will be shown, but users
 *                     cannot make annotations.
 * @param {*} settings some general settings. Currently only supports boolean value 'centerVertical'
 * @param {*} annotations Optionally, annotations in the object format (for fast lookup). If annotations are in the array format,
 *                        (as they should be outside of this tool), the conversion between both formats can be handled with
 *                        importAnnotations (array to object) and exportAnnotations (object to array)
 * @param {*} setAnnotations A function for saving annotations which, if given, should be the connected to annotations
 *                           (like const [annotations, setAnnotations] = useState({})). If not given, users cannot make annotations
 * @param {*} setReady       A function for passing a boolean to the parent to indicate that the text is ready (which is usefull
 *                           if the parent wants to transition to new texts nicely)
 * @returns
 */
const Document = ({ tokens, codebook, settings, annotations, setAnnotations, setReady }) => {
  // !! annotations doesn't yet work nice.
  // this way they are carried over across documents
  // make it so that an array of annotations is given.
  // setAnnotations is not linked, but returns the exported annotations
  // and then see whether it also makes sense to do the tokenization internally.

  const [tokensReady, setTokensReady] = useState(0);
  const [popup, triggerCodePopup, codeSelectorOpen] = useCodeSelector(
    tokens,
    codebook,
    annotations,
    setAnnotations
  );

  useEffect(() => {
    if (setReady) setReady((current) => current + 1);
  }, [tokensReady, setAnnotations, setReady]);

  if (!tokens) return null;

  return (
    <>
      <Tokens tokens={tokens} centerVertical={settings.centerVertical} setReady={setTokensReady} />
      <AnnotateNavigation
        tokens={tokens}
        codebook={codebook}
        annotations={annotations}
        triggerCodePopup={triggerCodePopup}
        setAnnotations={setAnnotations}
        eventsBlocked={codeSelectorOpen}
      />

      {popup}
    </>
  );
};

export default React.memo(Document);
