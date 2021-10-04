import React from "react";

import { Icon, Form, Radio, Divider } from "semantic-ui-react";

import QuestionTaskSettings from "./QuestionTaskSettings";
import AnnotateTaskSettings from "./AnnotateTaskSettings";
import db from "apis/dexie";

const defaultTaskSettings = {
  // contains the type of task (annotate, question) and settings for this task
  type: null,

  // annotate type settings
  annotate: {
    buttonMode: "recent",
    searchBox: true,
    rowSize: 5,
    codes: ["Some", "example", "options"],
  },

  // question type settings
  questions: [
    {
      name: "Question name",
      type: "select code",
      question: "[Enter the question to the coder here...]",
      codes: ["Some", "example", "options"],
    },
  ],
};

const TaskSettings = ({ codingjob }) => {
  const unitSettings = codingjob?.codebook?.unitSettings;
  const taskSettings = codingjob?.codebook?.taskSettings || defaultTaskSettings;
  const setTaskSettings = (us) => {
    db.setCodingjobProp(codingjob, "codebook.taskSettings", us);
  };

  if (!taskSettings || !unitSettings) return null;

  return (
    <div style={{ verticalAlign: "top", float: "top", paddingLeft: "1em" }}>
      <TypeForm taskSettings={taskSettings} setTaskSettings={setTaskSettings} />
      <Divider />
      {taskSettings.type === "questions" ? (
        <QuestionTaskSettings
          taskSettings={taskSettings}
          setTaskSettings={setTaskSettings}
          unitSettings={unitSettings}
        />
      ) : null}
      {taskSettings.type === "annotate" ? (
        <AnnotateTaskSettings
          taskSettings={taskSettings}
          setTaskSettings={setTaskSettings}
          unitSettings={unitSettings}
        />
      ) : null}
    </div>
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
        {radioButton("questions", "Question")}
      </Form.Group>
    </Form>
  );
};

export default React.memo(TaskSettings);
