import React, { useState } from "react";

import { Modal, Menu, Header, Button } from "semantic-ui-react";
import fileDownload from "js-file-download";
import db from "../apis/dexie";
import { useSelector } from "react-redux";

const ExportCodingjob = () => {
  const codingjob = useSelector(state => state.codingjob);
  const [open, setOpen] = useState(false);

  const downloadCodingjob = async () => {
    try {
      const documents = await db.getJobDocuments(codingjob, null, null);
      console.log(documents[0]);
      const cj = {
        details: { name: codingjob.name },
        codebook: codingjob.codebook,
        documents: documents,
      };
      const blob = new Blob([JSON.stringify(cj, null, 2)], { type: "application/json" });

      fileDownload(blob, `AmCATAnnotator_${codingjob.name}.json`);
    } catch (error) {
      console.error("" + error);
    }
  };

  // const downloadAnnotations = async (withDocuments, withTokens) => {
  //   //just give everything. Either as a JSON, CSV, or ZIP with CSV (for multiple)
  //   try {
  //     const documents = await db.getJobDocuments(codingjob, null, null);

  //     const annotations = documents.map(doc => {
  //       const obj = { annotations: doc.annotations }; // add index_span. Add doc_id
  //       if (withDocuments) obj.documents = doc.original;
  //       if (withTokens)
  //         obj.tokens = doc.tokens.map(token => {
  //           // get original tokens, and then add annotation_index"
  //           const originalToken = { ...token.original, annotation_index: token.index };
  //           if (!Object.keys(originalToken).includes("offset")) originalToken.offset = token.offset;
  //           return originalToken;
  //         });
  //     });
  //     //also give option to download zip folder of csv files: https://stuk.github.io/jszip/
  //     const obj = {
  //       details: { name: codingjob.name },
  //       codebook: codingjob.codebook,
  //       documents: documents,
  //     };
  //     const blob = new Blob([JSON.stringify(obj, null, 2)], { type: "application/json" });

  //     fileDownload(blob, `AmCATAnnotator_${codingjob.name}.json`);
  //   } catch (error) {
  //     console.error("" + error);
  //   }
  // };

  if (!codingjob) return null;

  return (
    <Modal
      closeIcon
      open={open}
      trigger={<Menu.Item icon="download" name="Download" style={{ color: "lightgreen" }} />}
      onClose={() => setOpen(false)}
      onOpen={() => setOpen(true)}
    >
      <Header icon="download" content="Download codingjob" />
      <Modal.Content>
        <p>Download Codingjob</p>
        <Button primary onClick={downloadCodingjob}>
          Download Codingjob
        </Button>
        <Button primary onClick={downloadCodingjob}>
          Download Annotations
        </Button>
      </Modal.Content>
      <Modal.Actions></Modal.Actions>
    </Modal>
  );
};

export default ExportCodingjob;
