import React, { useEffect } from "react";

import { Icon, Form, Radio, Divider } from "semantic-ui-react";

import QuestionTaskSettings from "./QuestionTaskSettings";
import AnnotateTaskSettings from "./AnnotateTaskSettings";
import db from "apis/dexie";

const defaultTaskSettings = {
  // contains the type of task (annotate, question) and settings for this task
  // note that each type corresponds to a key. So if for instance type = 'questions',
  // the questions settings will be used.
  type: null,

  // annotate type settings
  annotate: {
    settings: {},
    variables: [
      {
        name: "Variable name",
        buttonMode: "all",
        searchBox: false,
        codes: ["Some", "example", "options"],
      },
    ],
  },

  // question type settings
  questions: {
    settings: {},
    questions: [
      {
        name: "Question name",
        type: "select code",
        question: "[The question itself]",
        codes: ["No", "Skip", "Yes"],
      },
    ],
  },
};

const TaskSettings = ({ codingjob }) => {
  const unitSettings = codingjob?.unitSettings;
  const taskSettings = codingjob?.taskSettings || defaultTaskSettings;
  const setTaskSettings = (ts) => {
    db.setCodingjobProp(codingjob, "taskSettings", ts);
  };

  useEffect(() => {
    if (!codingjob?.taskSettings) return;
    if (!codingjob.importedCodes) return;
    for (let variable of Object.keys(codingjob.importedCodes)) {
      const codes = codingjob.importedCodes[variable];
      const ts = codingjob.taskSettings;
      if (!ts.annotate.variables.some((v) => v.name === variable)) {
        ts.annotate.variables.push({
          name: variable,
          buttonMode: codes.length > 10 ? "recent" : "all",
          searchBox: codes.length > 10,
          codes,
          enabled: false,
        });
        db.setCodingjobProp(codingjob, "taskSettings", ts);
      }
    }
  }, [codingjob]);

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
