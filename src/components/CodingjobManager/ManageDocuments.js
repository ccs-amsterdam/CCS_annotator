import React from "react";

import { Grid, Header } from "semantic-ui-react";
import UploadDocuments from "./UploadDocuments";
import DocumentTable from "components/CodingjobManager/DocumentTable";

const ManageDocuments = ({ codingjob }) => {
  return (
    <div style={{ paddingLeft: "1em" }}>
      <Grid columns={2}>
        <Grid.Column stretched width={8}>
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
