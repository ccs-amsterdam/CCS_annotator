import React from "react";

import { Grid, Header } from "semantic-ui-react";
import UploadDocuments from "./UploadDocuments";
import DocumentTable from "components/CodingjobManager/DocumentTable";

import db from "apis/dexie";

const ManageDocuments = ({ codingjob }) => {
  return (
    <div style={{ paddingLeft: "1em" }}>
      <Grid stackable columns={2}>
        <Grid.Column stretched width={8} style={{ height: "calc(100vh - 3em)" }}>
          <DocumentTable codingjob={codingjob} />
        </Grid.Column>
        <Grid.Column width={8}>
          <Header textAlign="center">Upload Documents</Header>
          <UploadDocuments codingjob={codingjob} />
        </Grid.Column>
      </Grid>
    </div>
  );
};

export default React.memo(ManageDocuments);
