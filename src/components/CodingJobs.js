import React, { useState } from "react";
import { Dropdown, Grid, Menu, Segment } from "semantic-ui-react";

import CodingjobSelector from "./CodingjobSelector";
import JobDetails from "./JobDetails";
import { UploadTextsCsv, UploadTokensCsv } from "./UploadDocuments";
import UploadRaw from "./UploadRaw";
import CodeBook from "./CodeBook";
import { useSelector } from "react-redux";

const CodingJobs = () => {
  const codingjob = useSelector((state) => state.codingjob);
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
        <Segment style={{ border: 0, minHeight: "80vh" }}>
          <Menu pointing secondary size="mini">
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

export default CodingJobs;
