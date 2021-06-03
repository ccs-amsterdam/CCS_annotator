import React, { useRef, useEffect, useState } from "react";
import { Container, Header, Table, Grid, Select, Form, Button, Icon } from "semantic-ui-react";
import { useSelector } from "react-redux";

//import CSVReader from "react-csv-reader";
//import Papa from "papaparse";
import { CSVReader } from "react-papaparse";
import db from "../apis/dexie";

export const UploadTextsCsv = ({ setActive }) => {
  const codingjob = useSelector((state) => state.codingjob);
  const [data, setData] = useState([]);
  const fileRef = useRef();

  const columns = {
    title: { required: true, defaults: ["title"] },
    text: { required: true, defaults: ["text", "body"] },
    texting: { required: true, defaults: ["text", "body"] },
    textings: { required: true, defaults: ["text", "body"] },
    text1: { required: true, defaults: ["text", "body"] },
    texting1: { required: true, defaults: ["text", "body"] },
    textings1: { required: true, defaults: ["text", "body"] },
    annotations: { required: true, defaults: ["annotations"] },
  };

  if (!codingjob) return null;
  return (
    <Container className="five wide">
      <CSVReader
        ref={fileRef}
        onFileLoad={(data) => setData(data)}
        addRemoveButton
        onRemoveFile={() => setData([])}
      >
        <span>Click or drag to upload</span>
      </CSVReader>
      <SubmitForm data={data} codingjob={codingjob} fileRef={fileRef} columns={columns} />
      <PreviewTable data={data} />
    </Container>
  );
};

export const UploadTokensCsv = ({ setActive }) => {
  const codingjob = useSelector((state) => state.codingjob);
  const [data, setData] = useState([]);
  const fileRef = useRef();

  if (!codingjob) return null;
  return (
    <Grid stackable style={{ marginTop: "4.3em" }}>
      <Grid.Row>
        <Grid.Column floated="right" width={4}>
          {" "}
          <CSVReader
            ref={fileRef}
            onFileLoad={(data) => setData(data)}
            addRemoveButton
            onRemoveFile={() => setData([])}
          >
            <span>Click to upload</span>
          </CSVReader>
        </Grid.Column>
        <Grid.Column floated="right" width={10}>
          <SubmitForm data={data} codingjob={codingjob} fileRef={fileRef} />
        </Grid.Column>
      </Grid.Row>
      <Grid.Row>
        <Grid.Column>
          <PreviewTable data={data} />
        </Grid.Column>
      </Grid.Row>
    </Grid>
  );
};

const SubmitForm = ({ data, codingjob, fileRef, columns }) => {
  const [options, setOptions] = useState([]);
  const [fields, setFields] = useState({});

  useEffect(() => {
    if (data.length <= 1) {
      setFields({});
      setOptions([]);
      return;
    }

    setOptions(
      data[0].data.map((colname) => {
        return { key: colname, value: colname, text: colname };
      })
    );

    let newfields = {};
    for (let col of Object.keys(columns)) {
      newfields[col] = null;
      for (let def of columns[col].defaults) {
        if (data[0].data.includes(def)) newfields[col] = def;
      }
    }
    setFields(newfields);
  }, [data, columns]);

  const csvToJson = (data, fields) => {
    const keys = data[0].data;
    return data.slice(1).map((row) => {
      const datarow = row.data.reduce(
        (obj, value, i) => {
          let key = keys[i];
          obj.original[key] = value; // keep original names and values (for exporting afterwards)

          for (let col of Object.keys(fields)) {
            if (fields[col] === key) {
              obj[col] = value;
              break;
            }
          }
          return obj;
        },
        { original: {}, annotations: "" }
      );
      return datarow;
    });
  };

  const uploadData = async () => {
    try {
      const preparedData = csvToJson(data, fields);
      await db.createDocuments(codingjob, preparedData);
      fileRef.current.removeFile();
    } catch (e) {
      console.log(e);
    }
  };

  const renderForms = () => {
    const keys = Object.keys(columns);

    const forms = [];
    let formgroup = [];

    for (let i = 0; i < keys.length; i++) {
      const column = keys[i];
      const ff = (
        <Form.Field
          control={Select}
          clearable
          required={columns[column].required}
          placeholder={column}
          options={options}
          value={fields[column]}
          onChange={(e, d) => {
            const newfields = { ...fields };
            newfields[column] = d.value;
            setFields(newfields);
          }}
        />
      );

      if (i % 3 === 0) {
        forms.push(formgroup);
        formgroup = [];
      } else {
        formgroup.push(ff);
      }
    }
    if (formgroup.length > 0) forms.push(formgroup);

    return forms.map((formgroup) => <Form.Group widths="equal">{formgroup}</Form.Group>);
  };

  const allDone = () => {
    for (let col of Object.keys(columns)) {
      if (columns[col].required && !fields[col]) return false;
    }
    return true;
  };

  if (data.length <= 1) return null;

  return (
    <>
      <Form>
        {renderForms()}
        <Form.Group widths="equal">
          <Form.Field control={Button} onClick={uploadData} disabled={!allDone()}>
            <Icon name="upload" />
            Upload
          </Form.Field>
        </Form.Group>
      </Form>
    </>
  );
};

const PreviewTable = ({ data }) => {
  const n = 5;

  const createHeader = (data) => {
    return data[0].data.map((colname) => {
      return (
        <Table.HeaderCell>
          <span title={colname}>{colname}</span>
        </Table.HeaderCell>
      );
    });
  };

  const createRows = (data, n) => {
    const previewdata = data.slice(0, n + 1);
    return previewdata.slice(1).map((row) => {
      return <Table.Row>{createRowCells(row.data)}</Table.Row>;
    });
  };

  const createRowCells = (row) => {
    return row.map((cell) => {
      return (
        <Table.Cell>
          <span title={cell}>{cell}</span>
        </Table.Cell>
      );
    });
  };

  if (data.length <= 1) return null;

  return (
    <Container style={{ marginTop: "2em" }}>
      <Table fixed singleLine basic="very">
        <Table.Header>
          <Table.Row>{createHeader(data)}</Table.Row>
        </Table.Header>
        <Table.Body>{createRows(data, n)}</Table.Body>
      </Table>
      {data.length > n ? <Header align="center">{data.length - 1 - n} more rows</Header> : null}
    </Container>
  );
};
