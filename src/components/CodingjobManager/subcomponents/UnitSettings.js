import React, { useEffect } from "react";
import { Icon, Form, Radio, Input, Dropdown, Popup, Button, Grid } from "semantic-ui-react";
import db from "apis/dexie";

const defaultUnitSettings = {
  textUnit: "document", // document, paragraph, sentence or span (span only if codingUnit is annotations)
  unitSelection: "allTextUnits", // or: annotations
  annotation: null,
  contextUnit: "document", // or: paragraph, sentence, no context
  contextWindow: [1, 1],

  n: null,
  seed: 42,
  ordered: false,
  balanceDocuments: false,
  balanceAnnotations: true,
  validCodes: {},
  highlightAnnotation: false,
  annotationMix: 0,
  onlyUnused: true,
  layout: {
    text: {},
    meta: {},
  },
};

const UnitSettings = ({ codingjob }) => {
  const unitSettings = codingjob?.unitSettings || defaultUnitSettings;
  const setUnitSettings = (us) => {
    db.setCodingjobProp(codingjob, "unitSettings", us);
  };

  if (!unitSettings) return null;
  return (
    <div style={{ verticalAlign: "top", float: "top", paddingLeft: "1em" }}>
      <Grid style={{ paddingTop: "1em" }}>
        <Grid.Row>
          <Grid.Column width={8}>
            <CodingUnitForm
              codingjob={codingjob}
              unitSettings={unitSettings}
              setUnitSettings={setUnitSettings}
            />
          </Grid.Column>
          <Grid.Column width={8}>
            <ContextUnitForm unitSettings={unitSettings} setUnitSettings={setUnitSettings} />
          </Grid.Column>
        </Grid.Row>
      </Grid>
    </div>
  );
};

const CodingUnitForm = ({ codingjob, unitSettings, setUnitSettings }) => {
  useEffect(() => {
    if (unitSettings?.textUnit === null)
      setUnitSettings({
        ...unitSettings,
        textUnit: "document",
        value: "allTextUnits",
        n: null,
        totalUnits: null,
      });
  }, [unitSettings, setUnitSettings]);

  const radioButton = (value, label, annotated, jump) => {
    const unitSelection = annotated ? "annotations" : "allTextUnits";
    let checked = unitSettings.textUnit === value && unitSettings.unitSelection === unitSelection;

    return (
      <Form.Field>
        <Radio
          value={value}
          label={label}
          checked={checked}
          onChange={(e, d) =>
            setUnitSettings({
              ...unitSettings,
              textUnit: value,
              unitSelection: unitSelection,
              n: null,
              totalUnits: null,
            })
          }
          style={{ marginLeft: jump ? "1em" : "0em" }}
        />
      </Form.Field>
    );
  };

  const annotationDropdown = () => {
    if (!codingjob.importedCodes) return null;
    if (Object.keys(codingjob.importedCodes).length === 0) return null;
    const options = Object.keys(codingjob.importedCodes).map((code) => ({
      key: code,
      value: code,
      text: code,
    }));
    if (unitSettings.annotation === null)
      setUnitSettings({ ...unitSettings, annotation: options[0].value });
    return (
      <span style={{ fontWeight: "bold" }}>
        Annotation:{"   "}
        <Dropdown
          options={options}
          value={unitSettings.annotation}
          onChange={(e, d) => setUnitSettings({ ...unitSettings, annotation: d.value })}
        />
      </span>
    );
  };

  const annotationButtons = () => {
    if (!unitSettings.annotation) return null;
    return (
      <>
        {radioButton("span", "Span annotation", true, true)}
        {radioButton("document", "Span + document", true, true)}
        {radioButton("paragraph", "Span + paragraph", true, true)}
        {radioButton("sentence", "Span + sentence", true, true)}
      </>
    );
  };

  return (
    <Form>
      <Form.Group>
        <Icon name="setting" />
        <label>Coding unit</label>
      </Form.Group>
      <Form.Group grouped widths="equal">
        {radioButton("document", "Document", false)}
        {radioButton("paragraph", "Paragraph", false)}
        {radioButton("sentence", "Sentence", false)}
        {annotationDropdown()}
        {annotationButtons()}
      </Form.Group>
    </Form>
  );
};

const ContextUnitForm = ({ unitSettings, setUnitSettings }) => {
  const setContextWindow = (value) => {
    setUnitSettings({
      ...unitSettings,
      contextWindow: value,
    });
  };

  const radioButton = (value, label) => {
    return (
      <Form.Field>
        <Radio
          value={value}
          label={label}
          disabled={unitSettings.textUnit === "document"}
          checked={unitSettings.contextUnit === value}
          onChange={(e, d) =>
            setUnitSettings({
              ...unitSettings,
              contextUnit: value,
            })
          }
        />
        {"  "}
        {(value === "paragraph" || value === "sentence") && value === unitSettings.contextUnit ? (
          <ContextWindow
            contextUnit={unitSettings.contextUnit}
            contextWindow={unitSettings.contextWindow}
            setContextWindow={setContextWindow}
          />
        ) : null}
      </Form.Field>
    );
  };

  return (
    <Form>
      <Form.Group>
        <Icon name="setting" />
        <label>Context unit</label>
      </Form.Group>
      <Form.Group grouped widths="equal">
        {radioButton("document", "Document")}
        {radioButton("paragraph", "Paragraph")}
        {radioButton("sentence", "Sentence")}
        {radioButton("none", "No context")}
      </Form.Group>
    </Form>
  );
};

// at some point maybe implement document filters
// like min paragraph and max tokens and such
//
// const DocumentFilters = () => {
//   const onChangeUseMinUnitIndex = (e, d) => {
//     setWithoutDelay("useMinUnitIndex", d.checked);
//   };
//   const onChangeUseMaxUnitIndex = (e, d) => {
//     setWithoutDelay("useMaxUnitIndex", d.checked);
//   };
//   const onChangeMinUnitIndex = (e, d) => {
//     let value = Number(d.value);
//     setDelayed((current) => ({ ...current, minUnitIndex: value }));
//   };
//   const onChangeMaxUnitIndex = (e, d) => {
//     let value = Number(d.value);
//     setDelayed((current) => ({ ...current, maxUnitIndex: value }));
//   };

//   return (
//     <Form>
//       <Form.Group>
//         <Form.Field width={8}>
//           <label>Maximum {unitSettings.textUnit}</label>

//           <Input
//             width={5}
//             min={0}
//             label={
//               <Checkbox
//                 toggle
//                 style={{ width: "6em" }}
//                 disabled={unitSettings.textUnit === "document"}
//                 checked={unitSettings.useMaxUnitIndex}
//                 onChange={onChangeUseMaxUnitIndex}
//               />
//             }
//             size="mini"
//             type="number"
//             value={unitSettings.maxUnitIndex}
//             onChange={onChangeMaxUnitIndex}
//           ></Input>
//         </Form.Field>
//       </Form.Group>
//     </Form>
//   );
// };

const ContextWindow = ({ contextUnit, contextWindow, setContextWindow }) => {
  if (contextUnit === "document") return null;

  return (
    <Popup
      hoverable
      trigger={
        <Button
          style={{
            padding: "0em 0.2em 0em 0.2em",
            background: "white",
            border: "1px solid",
          }}
        >{`${contextWindow[0]} - ${contextWindow[1]}`}</Button>
      }
    >
      <Dropdown.Menu>
        <Dropdown.Header content={`Set ${contextUnit} window`} />
        <Grid style={{ paddingTop: "1em", width: "20em" }}>
          <Grid.Column width={8}>
            <Input
              size="mini"
              value={contextWindow[0]}
              type="number"
              style={{ width: "6em" }}
              label={"before"}
              onChange={(e, d) => setContextWindow([Number(d.value), contextWindow[1]])}
            />
          </Grid.Column>
          <Grid.Column width={5}>
            <Input
              size="mini"
              value={contextWindow[1]}
              type="number"
              labelPosition="right"
              style={{ width: "6em" }}
              label={"after"}
              onChange={(e, d) => setContextWindow([contextWindow[0], Number(d.value)])}
            />
          </Grid.Column>
        </Grid>
      </Dropdown.Menu>
    </Popup>
  );
};

export default React.memo(UnitSettings);
