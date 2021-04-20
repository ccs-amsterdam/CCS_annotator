import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import {
  Breadcrumb,
  BreadcrumbSection,
  Dropdown,
  Grid,
} from "semantic-ui-react";

import CodingjobSelector from "./CodingjobSelector";
import AnnotationText from "./AnnotationText";
import AnnotationDB from "../apis/dexie";

const Annotate = () => {
  const codingjob = useSelector((state) => state.codingjob);
  const [doc, setDoc] = useState(null);
  const [documentList, setDocumentList] = useState([]);

  useEffect(() => {
    getDocuments(codingjob, setDoc, setDocumentList);
  }, [codingjob]);

  const documentSelector = (setDoc, documentList) => {
    const options = dropdownOptions(documentList);
    return (
      <Dropdown
        inline
        search
        onChange={(e, d) => {
          getDocument(setDoc, d.value);
        }}
        options={options}
        value={doc ? doc.doc_id : null}
      />
    );
  };

  return (
    <>
      <Grid>
        <Grid.Row>
          <Breadcrumb>
            <BreadcrumbSection link>
              <CodingjobSelector type="dropdown" />
            </BreadcrumbSection>
            <Breadcrumb.Divider />
            <BreadcrumbSection link>
              {documentSelector(setDoc, documentList)}
            </BreadcrumbSection>
          </Breadcrumb>
        </Grid.Row>
        <Grid.Row>
          <Grid.Column width={12}>
            <AnnotationText doc={doc ? doc : null} />
          </Grid.Column>
          <Grid.Column width={4}></Grid.Column>
        </Grid.Row>
      </Grid>
    </>
  );
};

const getDocuments = async (codingjob, setDoc, setDocumentList) => {
  if (codingjob) {
    const db = new AnnotationDB();
    const documents = await db.listDocuments(codingjob);
    setDocumentList(documents);
    if (documents.length > 0) {
      setDoc({
        doc_id: documents[0].doc_id,
        text: documents[0].title + "\n\n" + documents[0].text,
        annotations: prepareAnnotations(documents[0].annotations),
      });
    } else {
      setDoc(null);
    }
  }
};

const getDocument = async (setDoc, doc_id) => {
  const db = new AnnotationDB();
  const document = await db.getDocument(doc_id);
  setDoc({
    doc_id: document.doc_id,
    text: document.title + "\n\n" + document.text,
    annotations: prepareAnnotations(document.annotations),
  });
};

const prepareAnnotations = (annotations) => {
  if (!annotations || annotations === "") return {};
  const anns = JSON.parse(annotations);

  // create an object where the key is an offset, and the
  // value is an array that tells which codes start and end there
  // used in Tokens for matching to token indices
  // (matching to tokenindices is needed for speed, to keep coding nice and responsive)
  return anns.reduce((obj, ann) => {
    if (!obj[ann.offset]) obj[ann.offset] = { start: [], end: [] };
    if (!obj[ann.offset + ann.length])
      obj[ann.offset + ann.length] = { start: [], end: [] };
    obj[ann.offset].start.push(ann.code);
    obj[ann.offset + ann.length].end.push(ann.code);
    return obj;
  }, {});
};

const dropdownOptions = (documentList) => {
  const items = documentList.map((document, i) => {
    return {
      key: i,
      text: document.title,
      value: document.doc_id,
    };
  });
  return items;
};

export default Annotate;
