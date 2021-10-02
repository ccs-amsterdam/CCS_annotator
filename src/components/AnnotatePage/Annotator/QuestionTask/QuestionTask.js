import React from "react";
import { Grid } from "semantic-ui-react";
import QuestionForm from "./QuestionForm";
import Document from "components/Tokens/Document";
import useItemBundle from "hooks/useItemBundle";

const documentSettings = {
  height: 50,
  textUnitPosition: 1 / 4,
  showAnnotations: false,
  canAnnotate: false,
  saveAnnotations: true,
};

const QuestionTask = ({ item, codebook, preview = false }) => {
  const itemBundle = useItemBundle(item, codebook, documentSettings);

  if (!itemBundle) return null;
  const relativeWindowSplit = 50;
  const windowheight = 80;
  const windowSplit = relativeWindowSplit * (windowheight / 100);
  console.log(preview);
  return (
    <Grid.Column width={8}>
      <Grid.Row style={{ height: `${windowheight - windowSplit}vh` }}>
        <Document itemBundle={itemBundle} />
      </Grid.Row>
      <Grid.Row style={{ marginTop: "1em", height: `${windowheight - windowSplit}vh` }}>
        <QuestionForm itemBundle={itemBundle} preview={preview} />
      </Grid.Row>
    </Grid.Column>
  );
};

export default React.memo(QuestionTask);
