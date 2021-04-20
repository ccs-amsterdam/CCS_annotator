import React, { useState } from "react";
import { Form, Button } from "semantic-ui-react";
import { useSelector, useDispatch } from "react-redux";
import { setDocuments } from "../actions";

import SemanticDatepicker from "react-semantic-ui-datepickers";
import "react-semantic-ui-datepickers/dist/react-semantic-ui-datepickers.css";
import AnnotationDB from "../apis/dexie";

const CreateDocument = () => {
  const codingjob = useSelector((state) => state.codingjob);
  const dispatch = useDispatch();

  const [fieldValues, setFieldValues] = useState({});

  const documentFields = {
    title: "text",
    text: "text",
    annotations: "text",
  };

  const onCreate = async () => {
    let submitData = { ...fieldValues };

    for (const key of Object.keys(submitData)) {
      if (key === "date" || /_date$/.test(key)) {
        submitData[key] = submitData[key].toISOString();
      }
    }

    try {
      const db = new AnnotationDB();
      await db.createDocuments(codingjob, [submitData]);
      const documents = await db.listDocuments(codingjob);
      await dispatch(setDocuments(documents));
      setFieldValues({});
    } catch (e) {
      console.log(e);
    }
  };

  if (!codingjob) return null;

  return (
    <Form style={{ marginTop: "3em" }}>
      <DocumentForms
        fields={documentFields}
        fieldValues={fieldValues}
        setFieldValues={setFieldValues}
      />
      {!codingjob ? null : (
        <Button primary onClick={onCreate}>
          Create document
        </Button>
      )}
    </Form>
  );
};

const DocumentForms = function ({ fields, fieldValues, setFieldValues }) {
  const onSubmit = (key, value) => {
    const newFieldValues = { ...fieldValues };
    newFieldValues[key] = value;
    setFieldValues(newFieldValues);
  };

  if (!fields) return null;

  return Object.keys(fields).map((key) => {
    if (fields[key] === "text") {
      return (
        <Form.TextArea
          key={key}
          value={fieldValues[key] ? fieldValues[key] : ""}
          onChange={(e, d) => onSubmit(key, d.value)}
          label={key}
        />
      );
    }
    if (fields[key] === "date") {
      return (
        <Form.Field>
          <SemanticDatepicker
            key={key}
            label={key}
            value={fieldValues[key] ? fieldValues[key] : ""}
            onChange={(e, d) => onSubmit(key, d.value)}
          />
        </Form.Field>
      );
    }
    if (fields[key] === "keyword") {
      return (
        <Form.Field key={key}>
          <label>{key}</label>
          <input
            value={fieldValues[key] ? fieldValues[key] : ""}
            onChange={(e) => onSubmit(key, e.target.value)}
          />
        </Form.Field>
      );
    }
    return null;
  });
};

export default CreateDocument;
