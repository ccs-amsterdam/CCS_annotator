import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";

import { Breadcrumb, BreadcrumbSection, ButtonGroup, Grid, Dropdown } from "semantic-ui-react";

import CodingjobSelector from "./CodingjobSelector";
import AnnotationPage from "./AnnotationPage";
import db from "../apis/dexie";
import ItemSelector from "./ItemSelector";

const Annotate = () => {
  const codingjob = useSelector((state) => state.codingjob);

  const [codingUnit, setCodingUnit] = useState("document");
  const [contextUnit, setContextUnit] = useState("");
  const [mode, setMode] = useState("annotate");

  const [jobItems, setJobItems] = useState(null);
  const [jobItem, setJobItem] = useState(null);

  useEffect(() => {
    if (!codingjob) return null;
    setupCodingjob(codingjob, codingUnit, setJobItem, setJobItems);
  }, [codingjob, codingUnit, setJobItem, setJobItems]);

  console.log(jobItem);
  return (
    <Grid stackable container columns={2}>
      <Grid.Row>
        <Grid.Column width={10}>
          <Grid.Row>
            <ItemBreadcrumb jobItem={jobItem} />
          </Grid.Row>
          <br />
          <Grid.Row>
            <ButtonGroup compact basic>
              <CodingUnitDropdown codingUnit={codingUnit} setCodingUnit={setCodingUnit} />
              <ModeDropdown mode={mode} setMode={setMode} />
            </ButtonGroup>
          </Grid.Row>
        </Grid.Column>
        <Grid.Column align="center" floated="right" width={5}>
          <ItemSelector items={jobItems} setItem={setJobItem} />
        </Grid.Column>
      </Grid.Row>
      <Grid.Row>
        <AnnotationPage codingjob={codingjob} item={jobItem} mode={mode} />
      </Grid.Row>
    </Grid>
  );
};

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
        {`token ${jobItem.annotationIndex[0] + 1}-${jobItem.annotationIndex[1] + 1}`}
      </BreadcrumbSection>
    );
  };

  return (
    <Breadcrumb>
      <BreadcrumbSection link style={{ minWidth: "5em" }}>
        <CodingjobSelector type="dropdown" />
      </BreadcrumbSection>
      <Breadcrumb.Divider />
      <BreadcrumbSection>
        {jobItem?.document_id ? jobItem.document_id : jobItem ? jobItem.docIndex + 1 : 0}
      </BreadcrumbSection>
      {jobItem && jobItem.parIndex != null ? paragraph() : null}
      {jobItem && jobItem.sentIndex != null ? sentence : null}
      {jobItem && jobItem.annotationIndex != null ? annotation() : null}
    </Breadcrumb>
  );
};

const ModeDropdown = ({ mode, setMode }) => {
  return (
    <Dropdown text={mode} inline button compact>
      <Dropdown.Menu>
        <Dropdown.Header icon="setting" content="Set annotation mode" />
        <Dropdown.Item onClick={() => setMode("annotate")}>Annotate</Dropdown.Item>
        <Dropdown.Item onClick={() => setMode("code")}>Code</Dropdown.Item>
      </Dropdown.Menu>
    </Dropdown>
  );
};

const CodingUnitDropdown = ({ codingUnit, setCodingUnit }) => {
  return (
    <Dropdown text={codingUnit} inline button compact>
      <Dropdown.Menu>
        <Dropdown.Header icon="setting" content="Set Coding Unit" />
        <Dropdown.Item onClick={() => setCodingUnit("document")}>Document</Dropdown.Item>
        <Dropdown.Item onClick={() => setCodingUnit("paragraph")}>Paragraph</Dropdown.Item>
        <Dropdown.Item onClick={() => setCodingUnit("sentence")}>Sentence</Dropdown.Item>
        <Dropdown.Item onClick={() => setCodingUnit("annotation")}>Annotation</Dropdown.Item>
      </Dropdown.Menu>
    </Dropdown>
  );
};

const setupCodingjob = async (codingjob, codingUnit, setJobItem, setJobItems) => {
  // don't just grab n
  // loop over documents, and add index + doc_uid to index
  // for paragraph add for 1:n,
  // for sentences add for 1:n

  let items = await db.getCodingjobItems(codingjob, codingUnit);
  // if (codingUnit === "document") {
  //   const n = await db.getJobDocumentCount(codingjob);
  //   const docIndex = [...Array(n).keys()];
  //   items = docIndex.map((docIndex) => ({ docIndex }));
  // }
  // if (codingUnit === "paragraph") {
  // }
  // if (codingUnit === "sentence") {
  // }
  // if (codingUnit === "annotation") {
  //   let annotations = await db.getJobAnnotations(codingjob);
  //   items = annotations.reduce((array, annotation, docIndex) => {
  //     for (let i of Object.keys(annotation)) {
  //       for (let group of Object.keys(annotation[i])) {
  //         array.push({ docIndex, group, index: i, ...annotation[i][group] });
  //       }
  //     }
  //     return array;
  //   }, []);
  // }
  console.log(items);
  setJobItems(items);
  setJobItem(items[0]);
};

// from: https://stackoverflow.com/questions/11935175/sampling-a-random-subset-from-an-array
const getRandomSubarray = (arr, size) => {
  var shuffled = arr.slice(0),
    i = arr.length,
    min = i - size,
    temp,
    index;
  while (i-- > min) {
    index = Math.floor((i + 1) * Math.random());
    temp = shuffled[index];
    shuffled[index] = shuffled[i];
    shuffled[i] = temp;
  }
  return shuffled.slice(min);
};

export default Annotate;
