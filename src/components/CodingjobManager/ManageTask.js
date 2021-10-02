import React from "react";
import TaskSettings from "./ItemSettings/TaskSettings";
import { Grid, Header, Segment } from "semantic-ui-react";
import QuestionTask from "components/AnnotatePage/Annotator/QuestionTask/QuestionTask";

const ManageTask = ({ codingjob }) => {
  // When a new codingjob is loaded, set codingjobLoaded ref to false
  // this prevents actually loading the data until unitSettings has loaded
  // the unitSettings stored in the codingjob

  if (!codingjob) return null;

  return (
    <div>
      <Grid celled="internally" columns={2}>
        <Grid.Column verticalAlign="top" stretched width={8}>
          <Header textAlign="center">Settings</Header>
          <TaskSettings codingjob={codingjob} />
        </Grid.Column>
        <Grid.Column width={8}>
          <Header textAlign="center">Preview</Header>
          <PreviewTask codingjob={codingjob} />
        </Grid.Column>
      </Grid>
    </div>
  );
};

const PreviewTask = React.memo(({ codingjob, questionIndex }) => {
  const renderTaskPreview = type => {
    switch (type) {
      case "question":
        return <PreviewQuestionTask codingjob={codingjob} questionIndex={questionIndex} />;
      case "annotate":
        return <PreviewAnnotateTask codingjob={codingjob} questionIndex={questionIndex} />;
      default:
        return null;
    }
  };

  if (!codingjob?.codebook?.taskSettings?.type) return null;
  return renderTaskPreview(codingjob.codebook.taskSettings.type);
});

const questionPreviewItem = {
  text: `This is the first sentence of the first paragraph! And here is a second sentence.\n\n
           Now this here is the second paragraph, and if your coding unit is at the paragraph level, this is your paragrarph. 
           And then this sentence here would be your sentence if your coding unit is sentence, with THIS RIGHT HERE being the span annotation.\n\n
           And finally there's the third paragraph. Not much to say about this one`,
  annotation: { span: [52, 54] },
};

const PreviewQuestionTask = React.memo(({ codingjob }) => {
  let item = {
    ...questionPreviewItem,
    textUnit: codingjob.codebook.unitSettings.textUnit,
    unitIndex: 0,
  };
  if (item.textUnit === "paragraph") item.unitIndex = 1;
  if (item.textUnit === "sentence") item.unitIndex = 3;
  return <QuestionTask item={item} codebook={codingjob.codebook} preview={true} />;
});

const PreviewAnnotateTask = ({ codingjob }) => {
  return <Segment style={{ border: "0" }}>annotate task</Segment>;
};

export default React.memo(ManageTask);
