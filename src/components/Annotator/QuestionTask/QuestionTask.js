import React from "react";
import { Grid } from "semantic-ui-react";
import QuestionForm from "./QuestionForm";
import Document from "components/Tokens/Document";
import useItemBundle from "hooks/useItemBundle";
import { useSelector } from "react-redux";

const documentSettings = {
  textUnitPosition: 2 / 4,
  showAnnotations: false,
  centerVertical: true,
  canAnnotate: false,
};

const QuestionTask = ({ item, codebook, preview = false }) => {
  //const [menuHeight, setMenuHeight] = useState(50);
  const questionIndex = useSelector(state => state.questionIndex);
  const itemBundle = useItemBundle(item, codebook, documentSettings, preview);

  if (!itemBundle) return null;
  const splitHeight = codebook.questions[questionIndex].type === "annotinder" ? 70 : 50;

  return (
    <div style={{ height: "100%" }}>
      <Grid style={{ height: "100%" }}>
        <Grid.Column style={{ padding: "0", height: "100%" }}>
          <Grid.Row style={{ height: `${splitHeight}%` }}>
            <Document itemBundle={itemBundle} />
          </Grid.Row>
          <Grid.Row style={{ height: `${100 - splitHeight}%` }}>
            <QuestionForm
              itemBundle={itemBundle}
              codebook={codebook}
              questionIndex={questionIndex}
              preview={preview}
            />
          </Grid.Row>
        </Grid.Column>
      </Grid>
    </div>
  );
};

export default React.memo(QuestionTask);
