import React from "react";

import ManageAnnotations from "./ManageAnnotations";
import Tokens from "./Tokens";
import AnnotateNavigation from "./AnnotateNavigation";

const Document = ({ itemBundle }) => {
  if (!itemBundle) return null;
  return (
    <>
      <Tokens itemBundle={itemBundle} />
      <ManageAnnotations
        taskItem={itemBundle}
        saveAnnotations={itemBundle.settings.saveAnnotations}
      />
      {itemBundle.settings.canAnnotate ? <AnnotateNavigation tokens={itemBundle.tokens} /> : null}
    </>
  );
};

export default React.memo(Document);
