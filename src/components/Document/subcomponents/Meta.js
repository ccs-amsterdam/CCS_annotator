import React from "react";
import { Table } from "semantic-ui-react";

const Meta = ({ meta_fields }) => {
  const cellStyle = (row) => {
    const style = {};
    if (row.bold) style.fontWeight = "bold";
    if (row.italic) style.fontStyle = "italic";
    return style;
  };

  const rows = () => {
    return meta_fields.map((row) => {
      return (
        <Table.Row
          style={{
            fontSize: `${row.size != null ? row.size : 1}em`,
          }}
        >
          <Table.Cell width={1}>
            <b>{row.label || row.name}</b>
          </Table.Cell>
          <Table.Cell style={cellStyle(row)}>{formatValue(row.value)}</Table.Cell>
        </Table.Row>
      );
    });
  };

  return (
    <Table basic="very" compact style={{ lineHeight: "0.8" }}>
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
