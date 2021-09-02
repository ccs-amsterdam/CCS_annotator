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
} from "semantic-ui-react";

import CodingjobSelector from "./CodingjobSelector";
import AnnotationPage from "./AnnotationPage";
import db from "../apis/dexie";
import ItemSelector from "./ItemSelector";
import UnitSelection from "./UnitSelection";

const UNITSELECTIONDEFAULT = {
  value: "all",
  annotationMix: 0,
  n: null,
  seed: 42,
  ordered: true,
  balanceDocuments: false,
  balanceAnnotations: true,
};

const Annotate = () => {
  const codingjob = useSelector((state) => state.codingjob);
  const mode = useSelector((state) => state.mode);
  const codeMap = useSelector((state) => state.codeMap);

  const [textUnit, setTextUnit] = useState("document");
  const [unitSelection, setUnitSelection] = useState(UNITSELECTIONDEFAULT);
  const [unitSelectionSettings, setUnitSelectionSettings] = useState(UNITSELECTIONDEFAULT);
  const [contextUnit, setContextUnit] = useState({
    selected: "document",
    range: { paragraph: [1, 1], sentence: [2, 2] },
  });

  const [taskType, setTaskType] = useState("open annotation");
  const [jobItems, setJobItems] = useState(null);
  const [jobItem, setJobItem] = useState(null);

  useEffect(() => {
    db.getSetting("textUnit").then((setting) => setTextUnit(setting));
    db.getSetting("contextUnit").then((setting) => setContextUnit(setting));
    db.getSetting("unitSelection").then((setting) => setUnitSelectionSettings(setting));
  }, [codingjob, setUnitSelectionSettings]);

  useEffect(() => {
    if (!codingjob) return null;
    setupCodingjob(
      codingjob,
      textUnit,
      unitSelectionSettings,
      codeMap,
      setJobItem,
      setJobItems,
      setUnitSelection
    );
  }, [
    codingjob,
    textUnit,
    unitSelectionSettings,
    codeMap,
    setJobItem,
    setJobItems,
    setUnitSelection,
  ]);

  useEffect(() => {
    setUnitSelectionSettings((current) => ({ ...current, n: unitSelection.totalItems }));
  }, [textUnit, unitSelection.value, unitSelection.totalItems, setUnitSelectionSettings]);

  if (!codingjob) {
    return (
      <Grid stackable container style={{ height: "100vh", marginTop: "2em" }}>
        Select a codingjob: <CodingjobSelector type={"dropdown"} />
      </Grid>
    );
  }

  const designButtons = () => {
    return (
      <Grid.Column>
        <ButtonGroup compact>
          <TextUnitDropdown textUnit={textUnit} setTextUnit={setTextUnit} />
          <ContextUnitDropdown
            textUnit={textUnit}
            contextUnit={contextUnit}
            setContextUnit={setContextUnit}
          />

          <UnitSelection
            textUnit={textUnit}
            unitSelection={unitSelection}
            setUnitSelectionSettings={setUnitSelectionSettings}
          />
          {/* <SamplePopup unitSelection={unitSelection} sample={sample} setSample={setSample} /> */}

          <TaskTypeDropdown taskType={taskType} setTaskType={setTaskType} />
        </ButtonGroup>
      </Grid.Column>
    );
  };

  return (
    <div style={{ paddingLeft: "1em", float: "left", height: "100vh" }}>
      <Grid stackable>
        <Grid.Row style={{ paddingBottom: "0" }}>
          <Grid.Column width={8}>
            {mode === "design" ? <ItemBreadcrumb jobItem={jobItem} /> : null}
          </Grid.Column>
          <Grid.Column align="middle" floated="right" width={8}>
            <ItemSelector items={jobItems} setItem={setJobItem} />
          </Grid.Column>
        </Grid.Row>
        <Grid.Row>{mode === "design" ? designButtons() : null}</Grid.Row>
        <Grid.Row style={{ paddingLeft: "1em" }}>
          <AnnotationPage item={jobItem} taskType={taskType} contextUnit={contextUnit} />
        </Grid.Row>
      </Grid>
    </div>
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

const TextUnitDropdown = ({ textUnit, setTextUnit }) => {
  return (
    <Dropdown
      text={<>{buttonLabel(textUnit, "Text unit")}</>}
      inline
      button
      compact
      style={buttonStyle}
    >
      <Dropdown.Menu>
        <Dropdown.Header icon="setting" content="Text unit" />
        <Dropdown.Item onClick={() => setTextUnit("document")}>Document</Dropdown.Item>
        <Dropdown.Item onClick={() => setTextUnit("paragraph")}>Paragraph</Dropdown.Item>
        <Dropdown.Item onClick={() => setTextUnit("sentence")}>Sentence</Dropdown.Item>
      </Dropdown.Menu>
    </Dropdown>
  );
};

const ContextUnitDropdown = ({ textUnit, contextUnit, setContextUnit }) => {
  const onClick = (unit) => {
    if (contextUnit.selected !== unit) {
      setContextUnit({ ...contextUnit, selected: unit });
    }
  };
  return (
    <Dropdown
      disabled={textUnit === "document"}
      text={
        <>
          {buttonLabel(contextUnit.selected, "Context unit")}
          <ContextUnitRange contextUnit={contextUnit} setContextUnit={setContextUnit} />
        </>
      }
      inline
      button
      compact
      style={{ ...buttonStyle }}
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
          style={{
            paddingTop: 0,
            paddingBottom: 0,
            border: "none",
            boxShadow: "none",
            width: "5em",
          }}
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

const setupCodingjob = async (
  codingjob,
  textUnit,
  unitSelectionSettings,
  codeMap,
  setJobItem,
  setJobItems,
  setUnitSelection
) => {
  let [totalItems, items] = await db.getCodingjobItems(
    codingjob,
    textUnit,
    unitSelectionSettings,
    codeMap
  );
  setJobItems(items);
  setJobItem(items[0]);
  setUnitSelection({ ...unitSelectionSettings, totalItems: totalItems });
};

export default Annotate;
