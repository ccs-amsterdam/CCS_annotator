import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";

import {
  Breadcrumb,
  BreadcrumbSection,
  ButtonGroup,
  Grid,
  Dropdown,
  Popup,
  Button,
  Input,
  Container,
} from "semantic-ui-react";

import CodingjobSelector from "./CodingjobSelector";
import AnnotationPage from "./AnnotationPage";
import db from "../apis/dexie";
import ItemSelector from "./ItemSelector";

const Annotate = () => {
  const codingjob = useSelector((state) => state.codingjob);

  const [codingUnit, setCodingUnit] = useState("document");
  const [contextUnit, setContextUnit] = useState({
    selected: "document",
    range: { paragraph: [1, 1], sentence: [2, 2] },
  });

  const [taskType, setTaskType] = useState("open annotation");
  const [jobItems, setJobItems] = useState(null);
  const [jobItem, setJobItem] = useState(null);

  useEffect(() => {
    if (!codingjob) return null;
    setupCodingjob(codingjob, codingUnit, setJobItem, setJobItems);
  }, [codingjob, codingUnit, setJobItem, setJobItems]);

  if (!codingjob) {
    return (
      <Grid stackable container columns={2} style={{ height: "100vh", marginTop: "2em" }}>
        Select a codingjob: <CodingjobSelector type={"dropdown"} />
      </Grid>
    );
  }

  return (
    <Container style={{ paddingLeft: "1em", float: "left" }}>
      <Grid stackable columns={2}>
        <Grid.Row>
          <Grid.Column width={10}>
            <Grid.Row>
              <ItemBreadcrumb jobItem={jobItem} />
            </Grid.Row>
            <br />
            <Grid.Row>
              <ButtonGroup compact basic>
                <CodingUnitDropdown codingUnit={codingUnit} setCodingUnit={setCodingUnit} />
                {codingUnit === "document" ? null : (
                  <ContextUnitDropdown contextUnit={contextUnit} setContextUnit={setContextUnit} />
                )}

                <TaskTypeDropdown taskType={taskType} setTaskType={setTaskType} />
              </ButtonGroup>
            </Grid.Row>
          </Grid.Column>
          <Grid.Column align="center" floated="right" width={5}>
            <ItemSelector items={jobItems} setItem={setJobItem} />
          </Grid.Column>
        </Grid.Row>
        <Grid.Row>
          <AnnotationPage
            codingjob={codingjob}
            item={jobItem}
            taskType={taskType}
            contextUnit={contextUnit}
          />
        </Grid.Row>
      </Grid>
    </Container>
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

const TaskTypeDropdown = ({ taskType, setTaskType }) => {
  return (
    <Dropdown text={<>{buttonLabel(taskType, "Task")}</>} inline button compact style={buttonStyle}>
      <Dropdown.Menu>
        <Dropdown.Header icon="setting" content="Task type" />
        <Dropdown.Item onClick={() => setTaskType("open annotation")}>
          Open annotation
        </Dropdown.Item>
        <Dropdown.Item onClick={() => setTaskType("question based")}>Question based</Dropdown.Item>
      </Dropdown.Menu>
    </Dropdown>
  );
};

const buttonStyle = { paddingTop: 0, font: "Serif", fontStyle: "normal" };

const buttonLabel = (text, type) => {
  return (
    <span>
      <font style={{ fontSize: 9 }}>{type}:</font>
      <br />
      {text}
    </span>
  );
};

const CodingUnitDropdown = ({ codingUnit, setCodingUnit }) => {
  return (
    <Dropdown
      text={<>{buttonLabel(codingUnit, "Coding unit")}</>}
      inline
      button
      compact
      style={buttonStyle}
    >
      <Dropdown.Menu>
        <Dropdown.Header icon="setting" content="Coding Unit" />
        <Dropdown.Item onClick={() => setCodingUnit("document")}>Document</Dropdown.Item>
        <Dropdown.Item onClick={() => setCodingUnit("paragraph")}>Paragraph</Dropdown.Item>
        <Dropdown.Item onClick={() => setCodingUnit("sentence")}>Sentence</Dropdown.Item>
        <Dropdown.Item onClick={() => setCodingUnit("annotation")}>Annotation</Dropdown.Item>
      </Dropdown.Menu>
    </Dropdown>
  );
};

const ContextUnitDropdown = ({ contextUnit, setContextUnit }) => {
  const onClick = (unit) => {
    if (contextUnit.selected !== unit) {
      setContextUnit({ ...contextUnit, selected: unit });
    }
  };
  return (
    <Dropdown
      text={
        <>
          {buttonLabel(contextUnit.selected, "Context unit")}
          <ContextUnitRange contextUnit={contextUnit} setContextUnit={setContextUnit} />
        </>
      }
      inline
      button
      compact
      style={buttonStyle}
    >
      <Dropdown.Menu>
        <Dropdown.Header icon="setting" content="Context Unit" />
        <Dropdown.Item onClick={() => onClick("document")}>Document</Dropdown.Item>
        <Dropdown.Item onClick={() => onClick("paragraph")}>Paragraph</Dropdown.Item>
        <Dropdown.Item onClick={() => onClick("sentence")}>Sentence</Dropdown.Item>
      </Dropdown.Menu>
    </Dropdown>
  );
};

const ContextUnitRange = ({ contextUnit, setContextUnit }) => {
  const onChange = (value, which) => {
    if (value >= 0) {
      const newContext = { ...contextUnit };
      newContext.range[contextUnit.selected][which] = value;
      setContextUnit(newContext);
    }
  };

  const range = contextUnit.range[contextUnit.selected];
  if (contextUnit.selected === "document") return null;

  return (
    <Popup
      on="click"
      trigger={
        <Button
          style={{ paddingTop: 0, paddingBottom: 0, border: "none", boxShadow: "none" }}
        >{`${range[0]} - ${range[1]}`}</Button>
      }
    >
      <Dropdown.Menu>
        <Dropdown.Header content={`${contextUnit.selected} window`} />
        <Grid style={{ paddingTop: "1em", width: "20em" }}>
          <Grid.Column width={8}>
            <Input
              size="mini"
              value={range[0]}
              type="number"
              style={{ width: "6em" }}
              label={"before"}
              onChange={(e, d) => onChange(Number(d.value), 0)}
            />
          </Grid.Column>
          <Grid.Column width={5}>
            <Input
              size="mini"
              value={range[1]}
              type="number"
              labelPosition="right"
              style={{ width: "6em" }}
              label={"after"}
              onChange={(e, d) => onChange(Number(d.value), 1)}
            />
          </Grid.Column>
        </Grid>
      </Dropdown.Menu>
    </Popup>
  );
};

const setupCodingjob = async (codingjob, codingUnit, setJobItem, setJobItems) => {
  console.log(codingjob);
  let items = await db.getCodingjobItems(codingjob, codingUnit);

  console.log(items);
  setJobItems(items);
  setJobItem(items[0]);
};

// from: https://stackoverflow.com/questions/11935175/sampling-a-random-subset-from-an-array
// const getRandomSubarray = (arr, size) => {
//   var shuffled = arr.slice(0),
//     i = arr.length,
//     min = i - size,
//     temp,
//     index;
//   while (i-- > min) {
//     index = Math.floor((i + 1) * Math.random());
//     temp = shuffled[index];
//     shuffled[index] = shuffled[i];
//     shuffled[i] = temp;
//   }
//   return shuffled.slice(min);
// };

export default Annotate;
