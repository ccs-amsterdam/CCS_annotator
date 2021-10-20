import React, { useState } from "react";
import { Menu, Segment } from "semantic-ui-react";

import { UploadTextsCsv, UploadTokensCsv } from "./UploadForms";

const UploadDocuments = ({ codingjob }) => {
  const [activeItem, setActiveItem] = useState("Documents CSV");
  const renderSwitch = (activeItem) => {
    switch (activeItem) {
      case "Documents CSV":
        return <UploadTextsCsv codingjob={codingjob} />;
      case "Tokens CSV":
        return <UploadTokensCsv codingjob={codingjob} />;
      default:
        return null;
    }
  };

  return (
    <>
      <Menu attached="top" tabular>
        <Menu.Item
          name="Documents CSV"
          active={activeItem === "Documents CSV"}
          onClick={(e, d) => setActiveItem(d.name)}
        />
        <Menu.Item
          name="Tokens CSV"
          active={activeItem === "Tokens CSV"}
          onClick={(e, d) => setActiveItem(d.name)}
        />
      </Menu>
      <Segment attached="bottom">{renderSwitch(activeItem)}</Segment>
    </>
  );
};

export default UploadDocuments;
