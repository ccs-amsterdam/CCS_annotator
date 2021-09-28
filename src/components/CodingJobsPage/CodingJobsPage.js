import React, { useState } from "react";
import { Dropdown, Grid, Menu, Segment } from "semantic-ui-react";

import CodingjobSelector from "./CodingjobSelector";
import JobDetails from "./JobDetails";
import { UploadTextsCsv, UploadTokensCsv } from "./UploadDocuments";
import { useSelector } from "react-redux";

const CodingJobsPage = () => {
  const codingjob = useSelector((state) => state.codingjob);
  const [activeItem, setActiveItem] = useState("details");

  const renderSwitch = (activeItem) => {
    switch (activeItem) {
      case "details":
        return <JobDetails />;
      case "upload texts CSV":
        return <UploadTextsCsv />;
      case "upload tokens CSV":
        return <UploadTokensCsv />;

      default:
        return null;
    }
  };

  return (
    <Grid container stackable style={{ height: "100vh" }}>
      <Grid.Column floated="left" width={5}>
        <CodingjobSelector type="table" />
      </Grid.Column>
      <Grid.Column width={11}>
        <Segment style={{ border: 0, minHeight: "80%" }}>
          <Menu pointing secondary size="mini">
            <Menu.Item
              name="details"
              active={activeItem === "details"}
              onClick={(e, d) => setActiveItem(d.name)}
            />

            <Dropdown as={Menu.Item} active={activeItem.includes("upload")} text="Upload Documents">
              <Dropdown.Menu>
                <Dropdown.Item
                  text="Texts CSV"
                  onClick={(e, d) => setActiveItem("upload texts CSV")}
                />
                <Dropdown.Item
                  text="Tokens CSV"
                  onClick={(e, d) => setActiveItem("upload tokens CSV")}
                />
              </Dropdown.Menu>
            </Dropdown>
          </Menu>
          {!codingjob ? (
            <div style={{ height: "20em" }}>
              <i>No codingjob selected</i>
            </div>
          ) : (
            renderSwitch(activeItem)
          )}
        </Segment>
      </Grid.Column>
    </Grid>
  );
};

export default CodingJobsPage;
