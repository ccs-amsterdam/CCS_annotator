import React, { useState, useEffect } from "react";

import { Form, Radio, Icon, Checkbox, TextArea } from "semantic-ui-react";

import CodesEditor from "./CodesEditor";
import { standardizeCodes } from "ccs-annotator-client";
import VariableMenu from "./VariableMenu";

import Help from "components/CodingjobManager/subcomponents/Help";
import { useDispatch } from "react-redux";
import { blockEvents } from "actions";

const variableDefaultSettings = {
  name: "Variable name",
  instruction: "This is what you need to do",
  buttonMode: "all",
  onlyEdit: false,
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
    <>
      <h3>Global settings</h3>
      <GlobalAnnotateSettings taskSettings={taskSettings} setTaskSettings={setTaskSettings} />
      <h3>Variables</h3>
      <VariableMenu
        variables={taskSettings.annotate.variables}
        setVariables={setVariables}
        index={variableIndex}
        setIndex={setVariableIndex}
        newVariableDefaults={variableDefaultSettings}
      >
        <AnnotateForm
          taskSettings={taskSettings}
          setTaskSettings={setTaskSettings}
          variableIndex={variableIndex}
        />{" "}
      </VariableMenu>
    </>
  );
};

const GlobalAnnotateSettings = ({ taskSettings, setTaskSettings }) => {
  console.log(taskSettings);
  const globalSettings = taskSettings?.annotate?.settings;
  const variables = taskSettings?.annotate?.variables;
  const setGlobalSettings = (settings) => {
    setTaskSettings({
      ...taskSettings,
      annotate: { settings, variables: taskSettings.annotate.variables },
    });
  };

  if (!globalSettings || !variables) return null;

  return (
    <Form>
      <Form.Group>
        <Form.Field>
          <Checkbox
            disabled={variables.filter((v) => v.enabled == null || v.enabled).length <= 1}
            toggle
            label="Edit all option"
            checked={globalSettings.editAll}
            onChange={(e, d) => setGlobalSettings({ ...globalSettings, editAll: d.checked })}
          />
          <Help
            header="Add edit all option"
            texts={[
              `If there are two or more variables, adds the option for coders to view and edit all annotations together`,
            ]}
          />
        </Form.Field>
      </Form.Group>
    </Form>
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

  const codeSelectorConditionalFields = () => {
    if (annotateForm.enabled == null) {
      // if not imported (only imported have enabled key)
      return (
        <Form.Field>
          <Checkbox
            label="Single code (only select)"
            checked={annotateForm.singleCode}
            onChange={(e, d) => setAnnotateForm({ ...annotateForm, singleCode: d.checked })}
          />
        </Form.Field>
      );
    } else {
      return (
        <>
          <Form.Field>
            <Checkbox
              label="Edit mode"
              checked={annotateForm.editMode}
              onChange={(e, d) => setAnnotateForm({ ...annotateForm, editMode: d.checked })}
            />
            <Help
              header="Edit mode"
              texts={[
                "In edit mode you can not create new annotations, but only edit existing anntations",
              ]}
            />
          </Form.Field>
          <Form.Field>
            <Checkbox
              label="Only code "
              checked={annotateForm.editMode}
              onChange={(e, d) => setAnnotateForm({ ...annotateForm, editMode: d.checked })}
            />
            <Help
              header="Edit mode"
              texts={[
                "In edit mode you can not create new annotations, but only edit existing anntations",
              ]}
            />
          </Form.Field>
        </>
      );
    }
  };

  if (!taskSettings?.annotate?.variables?.[variableIndex]) return null;

  return (
    <Form>
      <InstructionInputField annotateForm={annotateForm} setAnnotateForm={setAnnotateForm} />

      <Form.Group>
        <Icon name="setting" />
        <label>Code Selector settings</label>
      </Form.Group>

      <Form.Group>{codeSelectorConditionalFields()}</Form.Group>
      <Form.Group>
        <Form.Field>
          <Checkbox
            label="Multiple"
            checked={annotateForm.multiple}
            onChange={(e, d) => setAnnotateForm({ ...annotateForm, multiple: d.checked })}
          />
          <Help
            header="Select multiple codes"
            texts={["Allows user to select (or delete) multiple codes before closing the popup"]}
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

const InstructionInputField = ({ annotateForm, setAnnotateForm }) => {
  const [instruction, setInstruction] = useState(annotateForm.instruction || "");
  const dispatch = useDispatch(); // needed to block key events from preview window

  useEffect(() => {
    if (instruction === null || instruction == null) return;
    if (annotateForm.instruction === instruction) return;
    const timer = setTimeout(() => {
      setAnnotateForm({ ...annotateForm, instruction });
    }, 1000);
    return () => clearTimeout(timer);
  }, [instruction, annotateForm, setAnnotateForm]);

  useEffect(() => {
    setInstruction(annotateForm.instruction);
  }, [annotateForm]);

  return (
    <Form.Group grouped>
      <label>Instruction</label>
      <Form.Field>
        <TextArea
          value={instruction}
          onFocus={() => dispatch(blockEvents(true))}
          onBlur={() => dispatch(blockEvents(false))}
          onChange={(e, d) => setInstruction(d.value)}
        />
      </Form.Field>
    </Form.Group>
  );
};

export default AnnotateTaskSettings;
