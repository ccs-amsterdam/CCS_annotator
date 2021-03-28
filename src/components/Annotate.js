import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { Dropdown, Grid } from "semantic-ui-react";
import CodingjobSelector from "./CodingjobSelector";
import AnnotationText from "./AnnotationText";
import CodeSelector from "./CodeSelector";

const Annotate = () => {
  const db = useSelector((state) => state.db);
  const codingjob = useSelector((state) => state.codingjob);
  const [doc, setDoc] = useState(null);
  const [documentList, setDocumentList] = useState([]);

  useEffect(() => {
    if (db && codingjob) {
      db.listDocuments(codingjob)
        .then((res) => {
          setDocumentList(res);
        })
        .catch((e) => {
          console.log(e);
        });
    }
  }, [db, codingjob]);

  const prepareAnnotations = (annotations) => {
    if (!annotations) return {};
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

  const getDocument = async (doc_id) => {
    const document = await db.getDocument(doc_id);
    setDoc({
      doc_id: document.doc_id,
      text: document.title + "\n\n" + document.text,
      annotations: prepareAnnotations(document.annotations),
    });
  };

  return (
    <>
      <Grid>
        <Grid.Row>
          <CodingjobSelector type="dropdown" />
          <Dropdown
            selection
            onChange={(e, d) => {
              getDocument(d.value);
            }}
            options={dropdownOptions(documentList)}
          />
        </Grid.Row>
        <Grid.Row>
          <Grid.Column width={12}>
            <AnnotationText doc={doc ? doc : null} />
          </Grid.Column>
          <Grid.Column width={4}>
            <CodeSelector />
          </Grid.Column>
        </Grid.Row>
      </Grid>
    </>
  );
};

export default Annotate;
