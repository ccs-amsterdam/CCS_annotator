import React from "react";
import { Grid } from "semantic-ui-react";
import QuestionForm from "./QuestionForm";
import Document from "components/Tokens/Document";

const documentSettings = {
  height: 50,
  textUnitPosition: 1 / 4,
  showAnnotations: false,
  canAnnotate: true,
  saveAnnotations: true,
};

const QuestionTask = ({ item, codebook }) => {
  // const mode = useSelector((state) => state.mode);

  // note that tokens is actually an object with doc included: {doc, tokens}
  // passing the states separately caused race issues

  if (item === null) return null;
  const relativeWindowSplit = 50;
  const windowheight = 80;
  const windowSplit = relativeWindowSplit * (windowheight / 100);

  return (
    <Grid.Column width={8}>
      <Grid.Row style={{ height: `${windowheight - windowSplit}vh` }}>
        <Document item={item} codebook={codebook} settings={documentSettings} />
      </Grid.Row>
      <Grid.Row style={{ marginTop: "1em", height: `${windowheight - windowSplit}vh` }}>
        <QuestionForm item={item} codebook={codebook} />
        test
      </Grid.Row>
    </Grid.Column>
  );
};

export default React.memo(QuestionTask);
