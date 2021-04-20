import React, { useState } from "react";

import { Modal, Menu, Header, Button } from "semantic-ui-react";
import { exportDB } from "dexie-export-import";
import fileDownload from "js-file-download";
import AnnotationDB from "../apis/dexie";

const Download = () => {
  const [open, setOpen] = useState(false);

  const onDownload = async () => {
    try {
      const db = new AnnotationDB();
      const blob = await exportDB(db.idb, {
        filter: (table, value, key) =>
          table === "codingjobs" || table === "documents",
        prettyJson: true,
        progressCallback,
      });
      fileDownload(blob, "AmCAT_Annotator.json");
    } catch (error) {
      console.error("" + error);
    }
  };

  return (
    <Modal
      closeIcon
      open={open}
      trigger={
        <Menu.Item
          icon="download"
          name="Download"
          style={{ color: "lightgreen" }}
        />
      }
      onClose={() => setOpen(false)}
      onOpen={() => setOpen(true)}
    >
      <Header icon="download" content="Download everything" />
      <Modal.Content>
        <p>Download all data as a single JSON dump</p>
      </Modal.Content>
      <Modal.Actions>
        <Button primary onClick={onDownload}>
          Download
        </Button>
      </Modal.Actions>
    </Modal>
  );
};

function progressCallback({ totalRows, completedRows }) {
  console.log(`Progress: ${completedRows} of ${totalRows} rows completed`);
}

export default Download;
