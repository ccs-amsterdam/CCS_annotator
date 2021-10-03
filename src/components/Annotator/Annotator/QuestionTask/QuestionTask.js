import React from "react";
import { Grid } from "semantic-ui-react";
import QuestionForm from "./QuestionForm";
import Document from "components/Tokens/Document";
import useItemBundle from "hooks/useItemBundle";

const documentSettings = {
  textUnitPosition: 1 / 4,
  showAnnotations: false,
  canAnnotate: false,
};

const QuestionTask = ({ item, codebook, preview = false }) => {
  const itemBundle = useItemBundle(item, codebook, documentSettings, preview);

  if (!itemBundle) return null;
  const splitHeight = 50;

  return (
    <Grid style={{ height: "100%" }}>
      <Grid.Column style={{ padding: "0", height: "100%" }}>
        <Grid.Row style={{ height: `${splitHeight}%` }}>
          <Document itemBundle={itemBundle} />
        </Grid.Row>
        <Grid.Row style={{ height: `${100 - splitHeight}%` }}>
          <QuestionForm itemBundle={itemBundle} codebook={codebook} preview={preview} />
        </Grid.Row>
      </Grid.Column>
    </Grid>
  );
};

export default React.memo(QuestionTask);
