import React from "react";

import { Breadcrumb, BreadcrumbSection } from "semantic-ui-react";

import CodingjobSelector from "components/CodingJobsPage/CodingjobSelector";

const ItemBreadcrumb = ({ jobItem }) => {
  const paragraph = () => {
    return (
      <BreadcrumbSection>
        <Breadcrumb.Divider />
        {`paragraph ${jobItem.parIndex + 1}`}
      </BreadcrumbSection>
    );
  };
  const sentence = () => {
    return (
      <BreadcrumbSection>
        {" "}
        <Breadcrumb.Divider />
        {`sentence ${jobItem.sentIndex + 1}`}
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
          {jobItem?.docIndex !== null ? `document ${jobItem.docIndex + 1}` : null}
        </BreadcrumbSection>
        {jobItem && jobItem.parIndex != null ? paragraph() : null}
        {jobItem && jobItem.sentIndex != null ? sentence() : null}
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
