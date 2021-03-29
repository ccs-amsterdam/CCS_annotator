import React, { useState } from "react";
import { Grid, Menu, Segment } from "semantic-ui-react";

import CodingjobSelector from "./CodingjobSelector";
import JobDetails from "./JobDetails";
import UploadDocuments from "./UploadDocuments";
import CreateDocument from "./CreateDocument";

const Create = () => {
  const [activeItem, setActiveItem] = useState("details");

  const renderSwitch = (activeItem) => {
    switch (activeItem) {
      case "details":
        return <JobDetails />;
      case "upload":
        return <UploadDocuments />;
      case "create":
        return <CreateDocument />;
      default:
        return null;
    }
  };

  return (
    <Grid stackable style={{ marginTop: "3em" }}>
      <Grid.Column floated="left" width={5}>
        <CodingjobSelector type="table" />
      </Grid.Column>
      <Grid.Column width={11}>
        <Segment style={{ border: 0 }}>
          <Menu pointing secondary>
            <Menu.Item
              name="details"
              active={activeItem === "details"}
              onClick={(e, d) => setActiveItem(d.name)}
            />
            <Menu.Item
              name="upload"
              active={activeItem === "upload"}
              onClick={(e, d) => setActiveItem(d.name)}
            />
            <Menu.Item
              name="create"
              active={activeItem === "create"}
              onClick={(e, d) => setActiveItem(d.name)}
            />
          </Menu>
          {renderSwitch(activeItem)}
        </Segment>
      </Grid.Column>
    </Grid>
  );
};

export default Create;
