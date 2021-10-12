import React, { useState, useEffect } from "react";

import ManageAnnotations from "./ManageAnnotations";
import Tokens from "./Tokens";
import AnnotateNavigation from "./AnnotateNavigation";
import useCodeSelector from "./useCodeSelector";

const Document = ({ itemBundle, codeMap, setReady, blockEvents }) => {
  const [tokensReady, setTokensReady] = useState(0);
  const [annotations, setAnnotations] = useState({});
  const [popup, triggerCodePopup, codeSelectorOpen] = useCodeSelector(
    itemBundle?.tokens,
    itemBundle?.codebook,
    annotations,
    setAnnotations
  );

  useEffect(() => {
    if (setReady) setReady((current) => current + 1);
  }, [tokensReady, setAnnotations, setReady]);

  if (!itemBundle) return null;
  if (codeMap) itemBundle.codebook.codeMap = codeMap;
  return (
    <>
      <Tokens itemBundle={itemBundle} setReady={setTokensReady} />
      <ManageAnnotations
        taskItem={itemBundle}
        annotations={annotations}
        saveAnnotations={itemBundle.settings.saveAnnotations}
      />
      {itemBundle.settings.canAnnotate ? (
        <AnnotateNavigation
          tokens={itemBundle.tokens}
          triggerCodePopup={triggerCodePopup}
          eventsBlocked={blockEvents || codeSelectorOpen}
        />
      ) : null}
      {popup}
    </>
  );
};

export default React.memo(Document);
