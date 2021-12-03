import React from "react";
import { Table } from "semantic-ui-react";

const Meta = ({ meta_fields }) => {
  const visibleMetaFields = meta_fields.filter((mf) => mf.visible);

  const cellStyle = (row) => {
    const style = { borderTop: "none" };
    if (row.bold) style.fontWeight = "bold";
    if (row.italic) style.fontStyle = "italic";
    return style;
  };

  const rows = () => {
    return visibleMetaFields.map((row) => {
      return (
        <Table.Row
          style={{
            fontSize: `${row.size != null ? row.size : 1}em`,
          }}
        >
          <Table.Cell width={1} style={{ borderTop: "none" }}>
            <b>{row.label || row.name}</b>
          </Table.Cell>
          <Table.Cell style={cellStyle(row)}>{formatValue(row.value)}</Table.Cell>
        </Table.Row>
      );
    });
  };

  if (visibleMetaFields.length === 0) return null;

  return (
    <Table
      basic="very"
      compact
      style={{
        lineHeight: "0.8",
        padding: "10px",
        paddingLeft: "10px",
        border: "1px solid grey",
        boxShadow: "5px 3px 3px #e0f2ff",
        background: "#e1f2ff",
        color: "black",
      }}
    >
      {rows()}
    </Table>
  );
};

const formatValue = (value) => {
  //   try if value is a date, if so, format accordingly
  //   Only remove T if time for now. Complicated due to time zones.
  const dateInt = Date.parse(value);
  if (dateInt) {
    return value.replace("T", " ");
  }
  // if (dateInt) {
  //   let date = new Date(dateInt);
  //   const offset = date.getTimezoneOffset();
  //   //date = new Date(date.getTime() - offset * 60 * 1000);
  //   return date.toISOString().replace("T", " ").split(".")[0];
  // }
  return value;
};

export default Meta;
