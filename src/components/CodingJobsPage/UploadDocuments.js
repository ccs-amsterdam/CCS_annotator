import React, { useRef, useEffect, useState } from "react";
import { Container, Header, Table, Grid, Form, Button, Icon, Dropdown } from "semantic-ui-react";
import { useSelector } from "react-redux";

//import CSVReader from "react-csv-reader";
//import Papa from "papaparse";
import { CSVReader } from "react-papaparse";
import db from "apis/dexie";

export const UploadTextsCsv = ({ setActive }) => {
  const columns = {
    document_id: { required: true, multiple: false, defaults: ["doc_id", "document_id"] },
    text_fields: {
      required: true,
      multiple: true,
      defaults: ["title", "headline", "body", "message", "text"],
    },
  };
  return <UploadCsv type="texts" columns={columns} setActive={setActive} />;
};

const renderTextForms = (columns, options, fields, setFields) => {
  return (
    <>
      <Form.Group widths="equal">
        {renderForm("document id", "document_id", columns, options, fields, setFields)}

        {renderForm(
          "text fields (can be multiple)",
          "text_fields",
          columns,
          options,
          fields,
          setFields
        )}
      </Form.Group>
    </>
  );
};

export const UploadTokensCsv = ({ setActive }) => {
  const columns = {
    document_id: { required: true, multiple: false, defaults: ["doc_id", "document_id"] },
    token: { required: true, multiple: false, defaults: ["token", "text"] },
    sentence: { required: false, multiple: false, defaults: ["sentence", "sentence_id"] },
    paragraph: { required: false, multiple: false, defaults: ["paragraph", "paragraph_id"] },
    offset: { required: false, int: true, multiple: false, defaults: ["offset", "start"] },
    end: { required: false, int: true, multiple: false, defaults: ["end"] },
    post: { required: false, multiple: false, defaults: ["post", "space"] },
    section: { required: false, multiple: false, defaults: ["section"] },
    annotations: { required: false, multiple: true, defaults: [] },
  };
  return <UploadCsv type="tokens" columns={columns} setActive={setActive} />;
};

const renderTokenForms = (columns, options, fields, setFields) => {
  return (
    <>
      <Form.Group widths="equal">
        {renderForm("document id", "document_id", columns, options, fields, setFields)}
        {renderForm("token", "token", columns, options, fields, setFields)}
        {renderForm("paragraph", "paragraph", columns, options, fields, setFields)}
        {renderForm("sentence", "sentence", columns, options, fields, setFields)}
      </Form.Group>
      <Form.Group widths="equal">
        {renderForm("start / offset", "offset", columns, options, fields, setFields)}
        {renderForm("end", "end", columns, options, fields, setFields)}
        {renderForm("space / post", "post", columns, options, fields, setFields)}
        {renderForm("section (title, text..)", "section", columns, options, fields, setFields)}
      </Form.Group>
      <Form.Group widths="equal">
        {renderForm("annotation columns", "annotations", columns, options, fields, setFields, true)}
      </Form.Group>
    </>
  );
};

const UploadCsv = ({ type = "text", columns, setActive }) => {
  const codingjob = useSelector((state) => state.codingjob);
  const [data, setData] = useState([]);
  const fileRef = useRef();

  return (
    <Container>
      <Grid>
        <Grid.Column width={5}>
          <CSVReader
            ref={fileRef}
            nodrag
            onFileLoad={(data) => setData(data)}
            addRemoveButton
            onRemoveFile={() => setData([])}
          >
            <span>Click to upload</span>
          </CSVReader>
        </Grid.Column>
        <Grid.Column floated="right" width={11}>
          <SubmitForm
            type={type}
            data={data}
            codingjob={codingjob}
            fileRef={fileRef}
            columns={columns}
          />
        </Grid.Column>
      </Grid>
      <PreviewTable data={data} />
    </Container>
  );
};

const SubmitForm = ({ type, data, codingjob, fileRef, columns }) => {
  const [options, setOptions] = useState([]);
  const [fields, setFields] = useState({});
  const [loading, setLoading] = useState(false);

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
      newfields[col] = columns[col].multiple ? [] : null;
      for (let def of columns[col].defaults) {
        if (data[0].data.includes(def)) {
          if (columns[col].multiple) {
            newfields[col].push(def);
          } else newfields[col] = def;
        }
      }
    }
    setFields(newfields);
  }, [data, columns]);

  const csvToJson = (data, fields) => {
    const keys = data[0].data;

    // first get indices from header row
    // more efficient than lookup for each row
    const fieldIndices = { ...fields };
    for (let field of Object.keys(fields)) {
      if (columns[field].multiple) {
        fieldIndices[field] = {};
        for (let subfield of fields[field]) {
          fieldIndices[field][subfield] = keys.findIndex((k) => k === subfield);
        }
      } else {
        fieldIndices[field] = keys.findIndex((k) => k === fields[field]);
      }
    }

    return data.slice(1).map((row) => {
      const original = keys.map((key, i) => {
        return { name: key, value: row.data[i] };
      });
      const datarow = { original };

      for (let field of Object.keys(fields)) {
        if (columns[field].multiple) {
          datarow[field] = [];
          for (let subfield of fields[field]) {
            const fieldindex = fieldIndices[field][subfield];
            if (fieldindex < 0) continue;
            let v = row.data[fieldindex];
            if (columns[field].int) v = parseInt(v);
            datarow[field].push({ name: keys[fieldindex], value: v });
          }
        } else {
          const fieldindex = fieldIndices[field];
          if (fieldindex < 0) continue;
          let v = row.data[fieldindex];
          datarow[field] = columns[field].int ? parseInt(v) : v;
        }
      }
      return datarow;
    });
  };

  const uploadData = async () => {
    try {
      setLoading(true);
      let preparedData = csvToJson(data, fields);
      if (type === "tokens") preparedData = tokensToDocumentList(preparedData);
      await db.createDocuments(codingjob, preparedData);
      await db.setCodingjobProp(codingjob, "unitSettings");

      fileRef.current.removeFile();
      //dispatch(selectCodingjob(codingjob));
      setLoading(false);
    } catch (e) {
      console.log(e);
      setLoading(false);
    }
  };

  const allDone = () => {
    for (let col of Object.keys(columns)) {
      if (columns[col].multiple) {
        if (columns[col].required && fields[col].length === 0) return false;
      } else {
        if (columns[col].required && !fields[col]) return false;
      }
    }
    return true;
  };

  //if (data.length <= 1) return null;

  return (
    <>
      <Form loading={loading}>
        {type === "texts" ? renderTextForms(columns, options, fields, setFields) : null}
        {type === "tokens" ? renderTokenForms(columns, options, fields, setFields) : null}
        <Form.Group>
          <Form.Field control={Button} onClick={uploadData} disabled={!allDone()}>
            <Icon name="upload" />
            Upload
          </Form.Field>
        </Form.Group>
      </Form>
    </>
  );
};

const tokensToDocumentList = (data) => {
  const documents = [];
  let tokens = [data[0]];
  for (let i = 1; i < data.length; i++) {
    if (data[i].document_id !== data[i - 1].document_id) {
      documents.push({ document_id: data[i - 1].document_id, tokens });
      tokens = [];
    }
    tokens.push(data[i]);
  }
  return documents;
};

const renderForm = (label, column, columns, options, fields, setFields) => {
  return (
    <Form.Field
      control={Dropdown}
      clearable
      selection
      multiple={columns[column].multiple ? true : false}
      label={{ children: label, style: { fontSize: "10px" } }}
      required={columns[column].required}
      options={options}
      value={fields[column]}
      onChange={(e, d) => {
        const newfields = { ...fields };
        newfields[column] = d.value;
        setFields(newfields);
      }}
      style={{ minWidth: "3em", fontSize: "10px" }}
    />
  );
};

const PreviewTable = ({ data }) => {
  const n = 5;

  const createHeader = (data) => {
    return data[0].data.map((colname) => {
      return (
        <Table.HeaderCell style={{ width: "7em" }}>
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
    <div
      style={{
        marginTop: "3em",
        overflow: "auto",
        width: "100%",
        border: "solid 1px",
      }}
    >
      <Table singleLine fixed size="small" compact>
        <Table.Header>
          <Table.Row>{createHeader(data)}</Table.Row>
        </Table.Header>
        <Table.Body>{createRows(data, n)}</Table.Body>
      </Table>
      {data.length > n ? <Header align="center">{data.length - 1 - n} more rows</Header> : null}
    </div>
  );
};
