import React, { useRef, useEffect, useState } from "react";
import {
  Container,
  Header,
  Table,
  Grid,
  Select,
  Form,
  Button,
  Icon,
} from "semantic-ui-react";
import { useSelector } from "react-redux";

//import CSVReader from "react-csv-reader";
//import Papa from "papaparse";
import { CSVReader } from "react-papaparse";

const UploadDocuments = ({ setActive }) => {
  const codingjob = useSelector((state) => state.codingjob);
  const [data, setData] = useState([]);
  const fileRef = useRef();

  if (!codingjob) return null;
  return (
    <Grid style={{ marginTop: "4.3em" }}>
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

const SubmitForm = ({ data, codingjob, fileRef }) => {
  const db = useSelector((state) => state.db);

  const [options, setOptions] = useState([]);
  const [titleField, setTitleField] = useState(null);
  const [textField, setTextField] = useState(null);
  const [annotationsField, setAnnotationsField] = useState(null);

  useEffect(() => {
    if (data.length <= 1) {
      setTitleField(null);
      setTextField(null);
      setAnnotationsField(null);
      setOptions([]);
      return;
    }

    setOptions(
      data[0].data.map((colname) => {
        return { key: colname, value: colname, text: colname };
      })
    );
    setTitleField(data[0].data.includes("title") ? "title" : null);
    setTextField(data[0].data.includes("text") ? "text" : null);
    setAnnotationsField(
      data[0].data.includes("annotations") ? "annotations" : null
    );
  }, [data]);

  const csvToJson = (data, titleField, textField, annotationsField) => {
    const keys = data[0].data;
    return data.slice(1).map((row) => {
      return row.data.reduce(
        (obj, value, i) => {
          let key = keys[i];
          if (key === titleField) {
            obj["title"] = value;
          } else if (key === textField) {
            obj["text"] = value;
          } else if (key === annotationsField) {
            obj["annotations"] = value;
          } else {
            obj["meta"][key] = value;
          }
          return obj;
        },
        { meta: {}, annotations: [] }
      );
    });
  };

  const uploadData = async () => {
    try {
      const preparedData = csvToJson(
        data,
        titleField,
        textField,
        annotationsField
      );
      await db.createDocuments(codingjob, preparedData);
      fileRef.current.removeFile();
    } catch (e) {
      console.log(e);
    }
  };

  if (data.length <= 1) return null;

  return (
    <>
      <Form>
        <Form.Group>
          <Form.Field
            control={Select}
            placeholder="title column"
            options={options}
            value={titleField}
            onChange={(e, d) => setTitleField(d.value)}
          />
          <Form.Field
            control={Select}
            placeholder="text column"
            options={options}
            value={textField}
            onChange={(e, d) => setTextField(d.value)}
          />
        </Form.Group>
        <Form.Group>
          <Form.Field
            control={Select}
            clearable
            placeholder="annotations (optional)"
            options={options}
            value={annotationsField}
            onChange={(e, d) => setAnnotationsField(d.value)}
          />
          <Form.Field
            control={Button}
            fluid
            onClick={uploadData}
            disabled={!titleField || !textField}
          >
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
      {data.length > n ? (
        <Header align="center">{data.length - 1 - n} more rows</Header>
      ) : null}
    </Container>
  );
};

export default UploadDocuments;
