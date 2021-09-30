import React from "react";
import { Icon, Form, Radio, Menu, Header, Grid } from "semantic-ui-react";

import QuestionFormSettings from "./QuestionFormSettings";
import db from "apis/dexie";

const questionDefaultSettings = {
  type: "select code",
  question: "[Enter the question to the coder here...]",
  options: ["Some", "example", "options"],
  colors: ["red", "white", "blue"],
};

const defaultTaskSettings = {
  // contains the type of task (annotate, question) and settings for this task
  type: null,

  // annotate type settings
  buttonMode: "recent", // or
  searchBox: true,
  rowSize: 5,

  // question type settings
  questions: [questionDefaultSettings],
};

const TaskSettings = ({ codingjob, questionIndex, setQuestionIndex }) => {
  const unitSettings = codingjob?.codebook?.unitSettings;
  const taskSettings = codingjob?.codebook?.taskSettings || defaultTaskSettings;
  const setTaskSettings = (us) => {
    db.setCodingjobProp(codingjob, "codebook.taskSettings", us);
  };

  if (!taskSettings || !unitSettings) return null;

  return (
    <div style={{ verticalAlign: "top", float: "top" }}>
      <TypeForm taskSettings={taskSettings} setTaskSettings={setTaskSettings} />
      {taskSettings.type === "question" ? (
        <QuestionList
          taskSettings={taskSettings}
          setTaskSettings={setTaskSettings}
          unitSettings={unitSettings}
          questionIndex={questionIndex}
          setQuestionIndex={setQuestionIndex}
        />
      ) : null}
    </div>
  );
};

const QuestionList = ({
  taskSettings,
  setTaskSettings,
  unitSettings,
  questionIndex,
  setQuestionIndex,
}) => {
  const onAdd = () => {
    const questions = taskSettings.questions;
    questions.push(questionDefaultSettings);
    setTaskSettings({ ...taskSettings, questions });
  };

  const questionMap = () => {
    return taskSettings.questions.map((question, i) => {
      const setQuestionForm = (value) => {
        const newTaskSettings = { ...taskSettings };
        newTaskSettings.questions[i] = value;
        setTaskSettings(newTaskSettings);
      };
      return (
        <QuestionFormSettings
          questionForm={question}
          setQuestionForm={setQuestionForm}
          unitSettings={unitSettings}
        />
      );
    });
  };

  const questionMenu = () => {
    const qlist = questionMap();
    //if (qlist.length === 0) return null;
    return (
      <Grid>
        <Grid.Column width={3}>
          <br />
          <Menu vertical style={{ width: "5em" }}>
            {Array(taskSettings.questions.length)
              .fill(0)
              .map((v, i) => {
                return (
                  <Menu.Item
                    name={`Q ${i + 1}`}
                    active={questionIndex === i}
                    onClick={(e, d) => setQuestionIndex(i)}
                  />
                );
              })}
            <Menu.Item
              name="Add question"
              style={{ paddingLeft: "0.3em", background: "lightblue" }}
              onClick={onAdd}
            />
          </Menu>
        </Grid.Column>

        <Grid.Column width={10}>
          <br />
          {qlist.length > 0 ? (
            <Header textAlign="center">{`Question ${questionIndex + 1}`}</Header>
          ) : null}
          {qlist[questionIndex]}
        </Grid.Column>
      </Grid>
    );
  };

  return (
    <>
      {questionMenu()}
      {/* <QuestionFormSettings
        taskSettings={taskSettings}
        setTaskSettings={setTaskSettings}
        unitSettings={unitSettings}
      /> */}
    </>
  );
};

const TypeForm = ({ taskSettings, setTaskSettings }) => {
  const radioButton = (value, label) => {
    return (
      <Form.Field>
        <Radio
          value={value}
          label={label}
          checked={taskSettings.type === value}
          onChange={(e, d) =>
            setTaskSettings({
              ...taskSettings,
              type: value,
            })
          }
        />
      </Form.Field>
    );
  };

  return (
    <Form>
      <Form.Group>
        <Icon name="setting" />
        <label>Set task type</label>
      </Form.Group>
      <Form.Group grouped widths="equal">
        {radioButton("annotate", "Annotate")}
        {radioButton("question", "Question")}
      </Form.Group>
    </Form>
  );
};

export default React.memo(TaskSettings);
