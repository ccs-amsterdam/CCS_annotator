import React, { useState, useEffect } from "react";
import db from "apis/dexie";
import { Button } from "semantic-ui-react";

import { CSVDownloader } from "react-papaparse";

const DownloadAnnotations = ({ localJobServer }) => {
  const [data, setData] = useState(null);

  useEffect(() => {
    switch (localJobServer.codebook.type) {
      case "annotate":
        formatAnnotateTaskResults(localJobServer, setData);
        break;
      case "questions":
        formatQuestionsTaskResults(localJobServer, setData);
        break;
      default:
        return null;
    }
  }, [localJobServer]);

  return (
    <CSVDownloader
      filename={`CSSannotator_${localJobServer.title}_${localJobServer.set}_${localJobServer.coderName}.json`}
      data={data}
      style={{ cursor: "pointer" }}
    >
      <Button
        loading={data === null}
        primary
        content="Download results"
        icon="download"
        labelPosition="left"
        size="huge"
      />
    </CSVDownloader>
  );
};

const formatAnnotateTaskResults = async (localJobServer, setData) => {
  // annotate results are returned in long format
  const unitMap = localJobServer.units.reduce((obj, unit) => {
    obj[unit.unit_id] = unit;
    return obj;
  }, {});
  console.log(unitMap);

  const annotationsPerUnit = await db.getAllAnnotations(localJobServer.id);

  const results = [];
  for (let unitAnnotations of annotationsPerUnit) {
    const annotations = unitAnnotations.annotations;
    const unit = unitMap[unitAnnotations.unit_id];
    for (let annotation of annotations) {
      const result = {
        document_id: unit.document_id,
        unit_id: unit.unit_id,
        ...unit.provenance,
        ...annotation,
      };
      results.push(result);
    }
  }
  setData(results);
};

const formatQuestionsTaskResults = async (localJobServer, setData) => {
  // questions results are returned in wide format
  const results = [];

  // variables of annotations are formatted as Q[question index]_[question name]
  // question index starts at 1, and spaces in question name are replaced with underscores
  const variables = localJobServer.codebook.questions.map(
    (question, i) => `Q${i + 1}_${question.name.replace(" ", "_")}`
  );

  const unitMap = localJobServer.units.reduce((obj, unit) => {
    obj[unit.unit_id] = unit;
    return obj;
  }, {});

  const annotationsPerUnit = await db.getAllAnnotations(localJobServer.id);
  for (let unitAnnotations of annotationsPerUnit) {
    const annotations = unitAnnotations.annotations;
    const unit = unitMap[unitAnnotations.unit_id];
    const result = {
      document_id: unit.document_id,
      unit_id: unit.unit_id,
      ...unit.provenance,
      offset: annotations[0].offset,
      length: annotations[0].length,
      section: annotations[0].section,
      ...annotations[0].meta,
    };

    if (unit.meta) {
      for (let key of Object.keys(unit.meta)) {
        result["meta_" + key] = unit.meta[key];
      }
    }

    for (let variable of variables) {
      const a = annotations.find((annotation) => annotation.variable === variable);
      result[variable] = a == null ? null : a.value;
    }
    results.push(result);
  }
  setData(results);
};

export default DownloadAnnotations;
