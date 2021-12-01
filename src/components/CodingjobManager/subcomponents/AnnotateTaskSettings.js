import React, { useState } from "react";

import { Form, Radio, Icon, Checkbox } from "semantic-ui-react";

import CodesEditor from "./CodesEditor";
import { standardizeCodes } from "library/codebook";
import VariableMenu from "./VariableMenu";

import Help from "components/CodingjobManager/subcomponents/Help";

const variableDefaultSettings = {
  name: "Variable name",
  buttonMode: "all",
  searchBox: false,
  singleCode: false,
  codes: ["No", "Skip", "Yes"],
};

const AnnotateTaskSettings = ({ taskSettings, setTaskSettings }) => {
  const [variableIndex, setVariableIndex] = useState(0);

  const setVariables = (variables) => {
    setTaskSettings({
      ...taskSettings,
      annotate: { settings: taskSettings.annotate.settings, variables: variables },
    });
  };

  return (
    <VariableMenu
      variables={taskSettings.annotate.variables}
      setVariables={setVariables}
      index={variableIndex}
      setIndex={setVariableIndex}
      newVariableDefaults={variableDefaultSettings}
    >
      <br />
      <AnnotateForm
        taskSettings={taskSettings}
        setTaskSettings={setTaskSettings}
        variableIndex={variableIndex}
      />{" "}
    </VariableMenu>
  );
};

const AnnotateForm = ({ taskSettings, setTaskSettings, variableIndex }) => {
  const annotateForm = taskSettings.annotate.variables[variableIndex];
  const setAnnotateForm = (value) => {
    const newTaskSettings = { ...taskSettings };
    const newValue = { ...value };

    newTaskSettings.annotate.variables[variableIndex] = newValue;
    setTaskSettings(newTaskSettings);
  };

  const codesEditor = () => {
    return (
      <CodesEditor
        codes={standardizeCodes(annotateForm.codes)}
        setCodes={(newCodes) => setAnnotateForm({ ...annotateForm, codes: newCodes })}
      />
    );
  };

  if (!taskSettings?.annotate?.variables?.[variableIndex]) return null;

  return (
    <Form>
      <Form.Group>
        <Icon name="setting" />
        <label>Code Selector settings</label>
      </Form.Group>

      <Form.Group>
        <Form.Field>
          <Checkbox
            label="Single code (only select)"
            disabled={annotateForm.buttonMode === "recent"}
            checked={annotateForm.singleCode}
            onChange={(e, d) => setAnnotateForm({ ...annotateForm, singleCode: d.checked })}
          />
        </Form.Field>
      </Form.Group>

      <Form.Group grouped style={{ display: annotateForm.singleCode ? "none" : "block" }}>
        <label>Code buttons</label>

        <Form.Field>
          <Radio
            value="all"
            label="Show all codes"
            checked={annotateForm.buttonMode === "all"}
            onChange={() => setAnnotateForm({ ...annotateForm, buttonMode: "all" })}
          />
          <Help
            header={"Show all active codes"}
            texts={[
              "Only codes that are 'active' will be shown",
              "You can toggle which codes are active in the codebook (top-right in menu bar)",
            ]}
          />
          <Form.Field style={{ marginLeft: "25px" }}>
            <Checkbox
              label="Include search field"
              disabled={annotateForm.buttonMode === "recent"}
              checked={annotateForm.searchBox}
              onChange={(e, d) => setAnnotateForm({ ...annotateForm, searchBox: d.checked })}
            />
          </Form.Field>
        </Form.Field>
        <Form.Field>
          <Radio
            value="recent"
            label="Show recently used"
            checked={annotateForm.buttonMode === "recent"}
            onChange={() => setAnnotateForm({ ...annotateForm, buttonMode: "recent" })}
          />
          <Help
            header={"Show recently used codes"}
            texts={[
              "Show only (active) codes that the coder used recently",
              "The Search box is always enabled with this option, and the buttons only serve as quick keys. This is especially usefull for very large codebooks, for instance for tagging specific named entities",
            ]}
          />
        </Form.Field>
      </Form.Group>

      <br />
      <div
        style={{
          overflow: "auto",
          margin: "-1em",
          display: annotateForm.singleCode ? "none" : "block",
        }}
      >
        {codesEditor()}
      </div>
    </Form>
  );
};

export default AnnotateTaskSettings;
