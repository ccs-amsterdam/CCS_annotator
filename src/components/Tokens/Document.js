import React from "react";

import ManageAnnotations from "./ManageAnnotations";
import Tokens from "./Tokens";
import AnnotateNavigation from "./AnnotateNavigation";

const Document = ({ itemBundle, codeMap, setReady }) => {
  if (!itemBundle) return null;
  if (codeMap) itemBundle.codebook.codeMap = codeMap;
  return (
    <>
      <Tokens itemBundle={itemBundle} setReady={setReady} />
      <ManageAnnotations
        taskItem={itemBundle}
        saveAnnotations={itemBundle.settings.saveAnnotations}
      />
      {itemBundle.settings.canAnnotate ? <AnnotateNavigation tokens={itemBundle.tokens} /> : null}
    </>
  );
};

export default React.memo(Document);
