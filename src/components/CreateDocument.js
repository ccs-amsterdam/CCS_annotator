import React, { useState, useEffect } from "react";
import { Form, Button } from "semantic-ui-react";
import { useSelector } from "react-redux";

import SemanticDatepicker from "react-semantic-ui-datepickers";
import "react-semantic-ui-datepickers/dist/react-semantic-ui-datepickers.css";

const CreateDocument = () => {
  const session = useSelector((state) => state.session);
  const index = useSelector((state) => state.index);

  const [indexFields, setIndexFields] = useState(null);
  const [fieldValues, setFieldValues] = useState(null);

  useEffect(() => {}, [fieldValues]);

  useEffect(() => {
    if (index && session) {
      session.getFields(index.name).then((res) => {
        setIndexFields(res.data);
      });
    } else {
      setIndexFields(null);
    }
  }, [session, index]);

  const onCreate = () => {
    session
      .createDocuments(index.name, [fieldValues])
      .then((res) => {
        // maybe check for 201 before celebrating
        console.log(res.status);
        setFieldValues(null);
      })
      .catch((e) => {
        console.log(e);
      });
  };

  return (
    <Form>
      <DocumentForms
        fields={indexFields}
        fieldValues={fieldValues}
        setFieldValues={setFieldValues}
      />
      {!index ? null : (
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

  const onDatePick = (key, value) => {
    try {
      onSubmit(key, value.toISOString());
    } catch (e) {
      console.log(e);
    }
  };

  if (!fields) return null;

  return Object.keys(fields).map((key) => {
    if (fields[key] === "text") {
      return (
        <Form.TextArea
          onChange={(e, d) => onSubmit(key, d.value)}
          label={key}
        />
      );
    }
    if (fields[key] === "date") {
      return (
        <SemanticDatepicker
          label={key}
          onChange={(e, d) => onDatePick(key, d.value)}
        />
      );
    }
    if (fields[key] === "keyword") {
      return (
        <Form.Field>
          <label>{key}</label>

          <input onChange={(e) => onSubmit(key, e.target.value)} />
        </Form.Field>
      );
    }
    return null;
  });
};

export default CreateDocument;
