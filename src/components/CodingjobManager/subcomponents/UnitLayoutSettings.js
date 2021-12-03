import React, { useEffect, useState } from "react";
import { Table, Input, Checkbox, Icon } from "semantic-ui-react";
import db from "apis/dexie";

const UnitLayoutSettings = ({ codingjob, units }) => {
  const [fields, setFields] = useState({ text: [], meta: [] });
  const unitSettings = codingjob?.unitSettings;
  const setUnitSettings = (us) => {
    db.setCodingjobProp(codingjob, "unitSettings", us);
  };

  useEffect(() => {
    if (!unitSettings?.layout) return;
    if (!units) return;
    const f = unitSettings.layout;
    for (let unit of units) {
      if (unit.textFields) {
        for (let textField of unit.textFields) {
          if (!f.text[textField]) f.text[textField] = defaultLayout(textField);
        }
      }
      if (unit.metaFields) {
        for (let metaField of unit.metaFields) {
          if (!f.meta[metaField]) f.meta[metaField] = defaultLayout(metaField);
        }
      }
    }
    setFields(f);
  }, [units, unitSettings]);
  if (!unitSettings) return null;

  return (
    <div style={{ overflowX: "auto" }}>
      <FieldSettingsTable
        fields={fields}
        unitSettings={unitSettings}
        setUnitSettings={setUnitSettings}
      />
    </div>
  );
};

const defaultLayout = (field) => {
  const l = {
    label: field.toUpperCase().replaceAll("_", " "),
    bold: false,
    italic: false,
    size: 1,
    visible: true,
    justify: true,
    paragraphs: false,
  };
  if (["title", "headline"].includes(field)) {
    l.size = 1;
    l.bold = true;
  }
  return l;
};

const FieldSettingsTable = ({ fields, unitSettings, setUnitSettings }) => {
  const update = (which, field, key, value) => {
    const newLayout = { ...unitSettings.layout };

    newLayout[which][field][key] = value;
    setUnitSettings({ ...unitSettings, layout: newLayout });
  };

  const visibleField = (which, fields, field) => {
    if (which === "text") return null;
    return (
      <Checkbox
        checked={fields[field].visible}
        onChange={() => update(which, field, "visible", !fields[field].visible)}
      />
    );
  };

  const labelField = (which, fields, field) => {
    return (
      <Input
        size="mini"
        value={fields[field].label}
        style={{ padding: "0" }}
        onChange={(e, d) => update(which, field, "label", d.value)}
      />
    );
  };

  const boldField = (which, fields, field) => {
    return (
      <Checkbox
        checked={fields[field].bold}
        onChange={() => update(which, field, "bold", !fields[field].bold)}
      />
    );
  };

  const italicField = (which, fields, field) => {
    return (
      <Checkbox
        checked={fields[field].italic}
        onChange={() => update(which, field, "italic", !fields[field].italic)}
      />
    );
  };

  const justifyField = (which, fields, field) => {
    return (
      <Checkbox
        checked={fields[field].justify}
        onChange={() => update(which, field, "justify", !fields[field].justify)}
      />
    );
  };

  const paragraphsField = (which, fields, field) => {
    return (
      <Checkbox
        checked={fields[field].paragraphs}
        onChange={() => update(which, field, "paragraphs", !fields[field].paragraphs)}
      />
    );
  };

  const sizeField = (which, fields, field) => {
    return (
      <Input
        size="mini"
        value={Math.round(fields[field].size * 100)}
        type="number"
        label="%"
        min={0}
        max={500}
        step={10}
        style={{ width: "100%", padding: "0", border: "none" }}
        onChange={(e, d) => {
          const nr = Number(d.value);
          if (isNaN(nr)) return;
          update(which, field, "size", Math.round(nr) / 100);
        }}
      />
    );
  };

  const rows = (which, fields) => {
    const n = Object.keys(fields).length;
    return Object.keys(fields).map((field, i) => {
      return (
        <Table.Row>
          {i === 0 ? (
            <Table.Cell rowSpan={n}>
              <b>{which}</b>
            </Table.Cell>
          ) : null}
          <Table.Cell>{field}</Table.Cell>
          <Table.Cell style={{ textAlign: "left" }}>
            {visibleField(which, fields, field)}
          </Table.Cell>
          <Table.Cell style={{ padding: "2px" }}>{labelField(which, fields, field)}</Table.Cell>
          <Table.Cell style={{ padding: "2px" }}>{sizeField(which, fields, field)}</Table.Cell>
          <Table.Cell style={{ textAlign: "left" }}>{boldField(which, fields, field)}</Table.Cell>
          <Table.Cell style={{ textAlign: "left" }}>{italicField(which, fields, field)}</Table.Cell>
          <Table.Cell style={{ textAlign: "left" }}>
            {justifyField(which, fields, field)}
          </Table.Cell>
          <Table.Cell style={{ textAlign: "left" }}>
            {paragraphsField(which, fields, field)}
          </Table.Cell>
        </Table.Row>
      );
    });
  };

  return (
    <Table structured compact unstackable singleLine>
      <Table.Header>
        <Table.Row>
          <Table.HeaderCell width={2}></Table.HeaderCell>
          <Table.HeaderCell width={3}>field</Table.HeaderCell>
          <Table.HeaderCell width={1}>
            <Icon name="eye slash" />
          </Table.HeaderCell>
          <Table.HeaderCell width={3}>label</Table.HeaderCell>
          <Table.HeaderCell width={3}>text size</Table.HeaderCell>
          <Table.HeaderCell width={1}>
            <Icon name="bold" />
          </Table.HeaderCell>
          <Table.HeaderCell width={1}>
            <Icon name="italic" />
          </Table.HeaderCell>
          <Table.HeaderCell width={1}>
            <Icon name="align justify" />
          </Table.HeaderCell>
          <Table.HeaderCell width={1}>
            <Icon name="paragraph" />
          </Table.HeaderCell>
        </Table.Row>
      </Table.Header>
      <Table.Body>
        {rows("meta", fields.meta)}
        {rows("text", fields.text)}
      </Table.Body>
    </Table>
  );
};

export default UnitLayoutSettings;
