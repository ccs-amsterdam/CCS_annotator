import React from "react";

import { Input, Form, Radio, Icon, Checkbox } from "semantic-ui-react";

import CodesEditor from "./CodesEditor";
import { standardizeCodes } from "util/codebook";

import Help from "components/CodingjobManager/subcomponents/Help";

// also need option to import annotations and import codebook
// to use the same annotations/codebook
// The codebook can then be edited, but the imported codes cannot be removed or renamed.

const AnnotateTaskSettings = ({ taskSettings, setTaskSettings }) => {
  const setAnnotateForm = (value) => {
    setTaskSettings({ ...taskSettings, annotate: value });
  };
  const setAnnotateSettings = (value) => {
    setAnnotateForm({ ...taskSettings.annotate, settings: value });
  };

  const codesEditor = () => {
    return (
      <CodesEditor
        codes={standardizeCodes(taskSettings.annotate.codes)}
        setCodes={(newCodes) => setAnnotateForm({ ...taskSettings.annotate, codes: newCodes })}
      />
    );
  };

  if (!taskSettings?.annotate) return null;

  return (
    <Form>
      <Form.Group>
        <Icon name="setting" />
        <label>Code Selector settings</label>
      </Form.Group>

      <Form.Group>
        <Form.Field>
          <Checkbox
            label="Search box"
            disabled={taskSettings.annotate.settings.buttonMode === "recent"}
            checked={
              taskSettings.annotate.settings.searchBox ||
              taskSettings.annotate.settings.buttonMode === "recent"
            }
            onChange={(e, d) =>
              setAnnotateSettings({ ...taskSettings.annotate.settings, searchBox: d.checked })
            }
          />
        </Form.Field>
      </Form.Group>
      <Form.Group grouped>
        <label>Code buttons</label>

        <Form.Field>
          <Radio
            value="all"
            label="Show all codes"
            checked={taskSettings.annotate.settings.buttonMode === "all"}
            onChange={() =>
              setAnnotateSettings({ ...taskSettings.annotate.settings, buttonMode: "all" })
            }
          />
          <Help
            header={"Show all active codes"}
            texts={[
              "Only codes that are 'active' will be shown",
              "You can toggle which codes are active in the codebook (top-right in menu bar)",
            ]}
          />
        </Form.Field>
        <Form.Field>
          <Radio
            value="recent"
            label="Show recently used"
            checked={taskSettings.annotate.settings.buttonMode === "recent"}
            onChange={() =>
              setAnnotateSettings({ ...taskSettings.annotate.settings, buttonMode: "recent" })
            }
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

      <Form.Group>
        <Form.Field>
          <Input
            size="mini"
            min={1}
            max={10}
            value={taskSettings.annotate.settings.rowSize}
            type="number"
            style={{ width: "6em" }}
            label={"Buttons per row"}
            onChange={(e, d) =>
              setAnnotateSettings({ ...taskSettings.annotate.settings, rowSize: d.value })
            }
          />
        </Form.Field>
      </Form.Group>
      {codesEditor()}
    </Form>
  );
};

export default AnnotateTaskSettings;
