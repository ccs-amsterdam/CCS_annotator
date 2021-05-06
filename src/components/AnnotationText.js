import React, { useState } from "react";
import { Grid } from "semantic-ui-react";

import SpanAnnotationsNavigation from "./SpanAnnotationsNavigation";
import SpanAnnotationsDB from "./SpanAnnotationsDB";

import Tokens from "./Tokens";
import SpanAnnotationsMenu from "./SpanAnnotationsMenu";

const AnnotationText = ({ doc }) => {
  const [tokens, setTokens] = useState([]);

  if (!doc) return null;
  return (
    <Grid container columns={2}>
      <Grid.Column
        width={10}
        style={{ overflowY: "auto", overflowX: "hidden", height: "75vh" }}
      >
        <Tokens text={doc.text} setTokens={setTokens} />
      </Grid.Column>
      <Grid.Column
        width={6}
        style={{ overflowY: "auto", overflowX: "hidden", height: "75vh" }}
      >
        <SpanAnnotationsMenu doc={doc} tokens={tokens} />
      </Grid.Column>

      <SpanAnnotationsNavigation doc={doc} tokens={tokens} />
      <SpanAnnotationsDB doc={doc} tokens={tokens} />
    </Grid>
  );
};

export default AnnotationText;

// title is optional. If empty, just show text nr in breadcrumb
// annotations can be document, paragraph, sentence or token level
// these are stored in separate keys in the annotations
// For paragraph, sentence and token level, the specific texts are also exported with the annotations
