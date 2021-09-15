import React from "react";
import { useDispatch } from "react-redux";

import { Popup, Button, Input, Form, Radio, Icon, Checkbox } from "semantic-ui-react";

import { blockEvents } from "actions";
import Help from "components/Help";

const CodeSelectorSettings = ({ codeSelector, setCodeSelector }) => {
  const dispatch = useDispatch();

  if (!codeSelector) return null;
  return (
    <Popup
      flowing
      hoverable
      wide
      mouseLeaveDelay={10000000} // just don't use mouse leave
      onOpen={() => dispatch(blockEvents(true))}
      onClose={() => dispatch(blockEvents(false))}
      position="bottom left"
      on="click"
      style={{ minWidth: "15em" }}
      trigger={
        <Button style={buttonStyle}>{buttonLabel(codeSelector.type, "Code Selector")}</Button>
      }
    >
      <Form>
        <Form.Group>
          <Icon name="setting" />
          <label>Code Selector settings</label>
        </Form.Group>

        <Form.Group>
          <Form.Field>
            <Checkbox
              toggle
              label="Search box"
              disabled={codeSelector.type === "recent"}
              checked={codeSelector.searchBox}
              onChange={(e, d) => setCodeSelector({ ...codeSelector, searchBox: d.checked })}
            />
          </Form.Field>
        </Form.Group>
        <Form.Group grouped>
          <label>Code buttons</label>
          <Form.Field>
            <Radio
              value="all"
              label="Show all codes"
              checked={codeSelector.type === "all"}
              onChange={() => setCodeSelector({ ...codeSelector, type: "all" })}
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
              checked={codeSelector.type === "recent"}
              onChange={() => setCodeSelector({ ...codeSelector, type: "recent" })}
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
              value={codeSelector.rowSize}
              type="number"
              style={{ width: "6em" }}
              label={"Buttons per row"}
              onChange={(e, d) => setCodeSelector({ ...codeSelector, rowSize: d.value })}
            />
          </Form.Field>
        </Form.Group>
      </Form>
    </Popup>
  );
};

const buttonStyle = { paddingTop: 0, font: "Serif", fontStyle: "normal" };

const buttonLabel = (text, type) => {
  return (
    <span>
      <font style={{ fontSize: 9 }}>{type}:</font>
      <br />
      {text}
    </span>
  );
};

export default CodeSelectorSettings;
