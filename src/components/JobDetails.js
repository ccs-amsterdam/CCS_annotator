import React from "react";
import { Container } from "semantic-ui-react";
import DocumentTable from "./DocumentTable";

const JobDetails = () => {
  return (
    <Container style={{ marginTop: "2em" }}>
      <DocumentTable />
    </Container>
  );
};

export default JobDetails;
