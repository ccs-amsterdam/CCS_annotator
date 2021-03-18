import React, { useState, useEffect } from "react";
import { Form, Button } from "semantic-ui-react";
import { useSelector } from "react-redux";

import SemanticDatepicker from "react-semantic-ui-datepickers";
import "react-semantic-ui-datepickers/dist/react-semantic-ui-datepickers.css";

const CreateDocument = () => {
  const amcat = useSelector((state) => state.amcat);
  const amcatIndex = useSelector((state) => state.amcatIndex);

  const [amcatIndexFields, setAmcatIndexFields] = useState(null);
  const [fieldValues, setFieldValues] = useState({});

  useEffect(() => {}, [fieldValues]);

  useEffect(() => {
    if (amcatIndex && amcat) {
      amcat.getFields(amcatIndex.name).then((res) => {
        setAmcatIndexFields(res.data);
      });
    } else {
      setAmcatIndexFields(null);
    }
  }, [amcat, amcatIndex]);

  const onCreate = () => {
    let submitData = { ...fieldValues };

    for (const key of Object.keys(submitData)) {
      if (key === "date" || /_date$/.test(key)) {
        submitData[key] = submitData[key].toISOString();
      }
    }

    amcat
      .createDocuments(amcatIndex.name, [fieldValues])
      .then((res) => {
        // maybe check for 201 before celebrating
        setFieldValues({});
      })
      .catch((e) => {
        console.log(e);
      });
  };

  return (
    <Form>
      <DocumentForms
        fields={amcatIndexFields}
        fieldValues={fieldValues}
        setFieldValues={setFieldValues}
      />
      {!amcatIndex ? null : (
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
        <SemanticDatepicker
          key={key}
          label={key}
          value={fieldValues[key] ? fieldValues[key] : ""}
          onChange={(e, d) => onSubmit(key, d.value)}
        />
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
