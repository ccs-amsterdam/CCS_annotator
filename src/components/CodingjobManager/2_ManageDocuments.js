import React from "react";

import { Grid, Header } from "semantic-ui-react";
import UploadDocuments from "./subcomponents/UploadDocuments";
import DocumentTable from "./subcomponents/DocumentTable";

const ManageDocuments = ({ codingjob }) => {
  return (
    <div style={{ paddingLeft: "1em" }}>
      <Grid stackable columns={2}>
        <Grid.Column width={8}>
          <Header textAlign="center" style={{ background: "#1B1C1D", color: "white" }}>
            Upload Documents
          </Header>
          <UploadDocuments codingjob={codingjob} />
        </Grid.Column>
        <Grid.Column width={8}>
          <Header textAlign="center" style={{ background: "#1B1C1D", color: "white" }}>
            Document list
          </Header>

          <DocumentTable codingjob={codingjob} />
        </Grid.Column>
      </Grid>
    </div>
  );
};

export default React.memo(ManageDocuments);
