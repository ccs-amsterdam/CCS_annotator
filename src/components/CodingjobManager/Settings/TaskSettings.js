import React, { useEffect } from "react";

import { Icon, Form, Radio, Divider } from "semantic-ui-react";

import QuestionTaskSettings from "./QuestionTaskSettings";
import AnnotateTaskSettings from "./AnnotateTaskSettings";
import db from "apis/dexie";

const defaultTaskSettings = {
  // contains the type of task (annotate, question) and settings for this task
  type: null,

  // annotate type settings
  annotate: {
    settings: {
      buttonMode: "recent",
      searchBox: true,
      rowSize: 5,
    },
    codes: ["Some", "example", "options"],
  },

  // question type settings
  questions: {
    settings: {},
    questions: [
      {
        type: "select code",
        name: "[Question name]",
        question: "[The question itself]",
        codes: ["No", "Skip", "Yes"],
      },
    ],
  },
};

const TaskSettings = ({ codingjob }) => {
  const unitSettings = codingjob?.unitSettings;
  const taskSettings = codingjob?.taskSettings || defaultTaskSettings;
  const setTaskSettings = us => {
    db.setCodingjobProp(codingjob, "taskSettings", us);
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
  useEffect(() => {
    if (!taskSettings?.type)
      setTaskSettings({
        ...taskSettings,
        type: "annotate",
      });
  }, [taskSettings, setTaskSettings]);

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
