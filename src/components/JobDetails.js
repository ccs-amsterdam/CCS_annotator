import React from "react";
import { Container } from "semantic-ui-react";
import DocumentTable from "./DocumentTable";

const JobDetails = () => {
  return (
    <Container style={{ marginTop: "30px", overflow: "auto" }}>
      <DocumentTable width="800px" />
    </Container>
  );
};

export default JobDetails;
