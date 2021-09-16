import React from "react";

import { Breadcrumb, BreadcrumbSection } from "semantic-ui-react";

import CodingjobSelector from "components/CodingJobsPage/CodingjobSelector";
import { is } from "@babel/types";

const ItemBreadcrumb = ({ jobItem }) => {
  const paragraph = () => {
    return (
      <BreadcrumbSection>
        <Breadcrumb.Divider />
        {`paragraph ${jobItem.itemIndex}`}
      </BreadcrumbSection>
    );
  };

  const paragraphOrSentence = (jobItem) => {
    if (jobItem === null) return null;
    return (
      <BreadcrumbSection>
        {" "}
        <Breadcrumb.Divider />
        {`${jobItem.textUnit} ${jobItem.unitIndex}`}
      </BreadcrumbSection>
    );
  };
  const annotation = () => {
    return (
      <BreadcrumbSection>
        <Breadcrumb.Divider />
        {jobItem.annotation.span != null ? (
          `${jobItem.annotation.group} ${jobItem.annotation.span[0]}-${jobItem.annotation.span[1]}`
        ) : (
          <>
            {`${jobItem.annotation.group}`}
            {"  "}
            <sup>(random added)</sup>
          </>
        )}
      </BreadcrumbSection>
    );
  };
  const itemCrumbs = () => {
    if (jobItem === null || jobItem == null) return null;
    return (
      <>
        <Breadcrumb.Divider />
        <BreadcrumbSection>
          {jobItem?.docIndex !== null ? `document ${jobItem.docIndex}` : null}
        </BreadcrumbSection>
        {paragraphOrSentence(jobItem)}
        {jobItem && jobItem.annotation != null ? annotation() : null}
      </>
    );
  };

  return (
    <Breadcrumb>
      <BreadcrumbSection link style={{ minWidth: "5em" }}>
        <CodingjobSelector type="dropdown" />
      </BreadcrumbSection>
      {itemCrumbs()}
    </Breadcrumb>
  );
};

export default ItemBreadcrumb;
