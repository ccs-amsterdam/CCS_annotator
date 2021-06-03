import React, { useState } from "react";
import { Dropdown, Grid, Menu, Segment } from "semantic-ui-react";

import CodingjobSelector from "./CodingjobSelector";
import JobDetails from "./JobDetails";
import { UploadTextsCsv, UploadTokensCsv } from "./UploadDocuments";
import UploadRaw from "./UploadRaw";
import CodeBook from "./CodeBook";

const CodingJobs = () => {
  const [activeItem, setActiveItem] = useState("details");

  const renderSwitch = (activeItem) => {
    switch (activeItem) {
      case "details":
        return <JobDetails />;
      case "codebook":
        return <CodeBook />;
      case "upload texts CSV":
        return <UploadTextsCsv />;
      case "upload tokens CSV":
        return <UploadTokensCsv />;
      case "upload Raw":
        return <UploadRaw />;
      default:
        return null;
    }
  };

  return (
    <Grid stackable>
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
              name="codebook"
              active={activeItem === "codebook"}
              onClick={(e, d) => setActiveItem(d.name)}
            />
            <Dropdown as={Menu.Item} active={activeItem.includes("upload")} text="Upload Documents">
              <Dropdown.Menu>
                <Dropdown.Item
                  text="upload texts CSV"
                  onClick={(e, d) => setActiveItem("upload texts CSV")}
                />
                <Dropdown.Item
                  text="upload tokens CSV"
                  onClick={(e, d) => setActiveItem("upload tokens CSV")}
                />
                <Dropdown.Item text="Raw" onClick={(e, d) => setActiveItem("upload Raw")} />
              </Dropdown.Menu>
            </Dropdown>
          </Menu>
          {renderSwitch(activeItem)}
        </Segment>
      </Grid.Column>
    </Grid>
  );
};

export default CodingJobs;
