import React, { useEffect, useState, useRef } from "react";
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

const defaultItemSettings = {
  textUnit: "document",
  contextUnit: {
    selected: "document",
    range: { paragraph: [1, 1], sentence: [2, 2] },
  },
  unitSelection: {
    value: "all",
    annotationMix: 0,
    n: null,
    seed: 42,
    ordered: true,
    balanceDocuments: false,
    balanceAnnotations: true,
  },
  taskType: "annotate",
};

const Annotate = () => {
  const codingjob = useSelector((state) => state.codingjob);
  const mode = useSelector((state) => state.mode);
  const codeMap = useSelector((state) => state.codeMap);

  const [itemSettings, setItemSettings] = useState(defaultItemSettings);
  const totalItems = useRef(0);
  const setItemSetting = (which) => {
    // creates a set state function for a specific key in itemSettings
    // setItemSetting('textUnit') returns a function for setting itemSettings.textUnit
    return (value) => setItemSettings((current) => ({ ...current, [which]: value }));
  };

  const [jobItems, setJobItems] = useState(null);
  const [jobItem, setJobItem] = useState(null);

  // this makes sure that itemSettings are loaded when codingjob changes,
  // before the settings can be overwritten
  const codingjobLoaded = useRef(false);

  useEffect(() => {
    if (!codingjob) return null;
    codingjobLoaded.current = false;
    getCodingjobSettings(codingjob, setItemSettings, codingjobLoaded);
  }, [codingjob, setItemSettings, codingjobLoaded]);

  useEffect(() => {
    if (codingjobLoaded.current) {
      console.log("kankefod");
      console.log(itemSettings);
      db.setCodingjobProp(codingjob, "itemSettings", itemSettings);
    }
  }, [codingjob, itemSettings, codingjobLoaded]);

  useEffect(() => {
    if (!codingjob) return null;
    if (!codingjobLoaded.current) return null;
    setupCodingjob(
      codingjob,
      itemSettings.textUnit,
      itemSettings.unitSelection,
      totalItems,
      codeMap,
      setJobItem,
      setJobItems,
      setItemSettings
    );
  }, [
    codingjob,
    itemSettings.textUnit,
    itemSettings.unitSelection,
    totalItems,
    codeMap,
    setJobItem,
    setJobItems,
    setItemSettings,
  ]);

  const designButtons = () => {
    return (
      <Grid.Column>
        <ButtonGroup compact>
          <TextUnitDropdown textUnit={itemSettings.textUnit} setItemSettings={setItemSettings} />
          <ContextUnitDropdown
            textUnit={itemSettings.textUnit}
            contextUnit={itemSettings.contextUnit}
            setContextUnit={setItemSetting("contextUnit")}
          />

          <UnitSelection
            totalItems={totalItems.current}
            unitSelection={itemSettings.unitSelection}
            setItemSettings={setItemSettings}
          />
          {/* <SamplePopup unitSelection={unitSelection} sample={sample} setSample={setSample} /> */}

          <TaskTypeDropdown
            taskType={itemSettings.taskType}
            setTaskType={setItemSetting("taskType")}
          />
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
          <Grid.Column width={8}>
            <ItemSelector items={jobItems} setItem={setJobItem} />
          </Grid.Column>
        </Grid.Row>
        <Grid.Row>{mode === "design" ? designButtons() : null}</Grid.Row>
        <Grid.Row style={{ paddingLeft: "1em" }}>
          <AnnotationPage item={jobItem} itemSettings={itemSettings} />
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
        <Dropdown.Item onClick={() => setTaskType("annotate")}>Open annotation</Dropdown.Item>
        <Dropdown.Item onClick={() => setTaskType("question")}>Question based</Dropdown.Item>
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

const TextUnitDropdown = ({ textUnit, setItemSettings }) => {
  const setTextUnit = (value) =>
    setItemSettings((current) => ({
      ...current,
      textUnit: value,
      unitSelection: { ...current.unitSelection, n: null },
    }));

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
  unitSelection,
  totalItems,
  codeMap,
  setJobItem,
  setJobItems,
  setItemSettings
) => {
  let items;
  [totalItems.current, items] = await db.getCodingjobItems(
    codingjob,
    textUnit,
    unitSelection,
    codeMap
  );
  setJobItems(items);
  setJobItem(items[0]);

  if (unitSelection.n === null || unitSelection.n == null) {
    setItemSettings((current) => {
      const newUnitSelection = { ...unitSelection, n: totalItems.current };
      return { ...current, unitSelection: newUnitSelection };
    });
  }
};

const getCodingjobSettings = async (codingjob, setItemSettings, codingjobLoaded) => {
  const itemSettings = await db.getCodingjobProp(codingjob, "itemSettings");
  codingjobLoaded.current = true;
  console.log(itemSettings);
  if (itemSettings) setItemSettings(itemSettings);
};

export default React.memo(Annotate, (prev, next) => {
  // for (let k of Object.keys(prev)) {
  //   if (prev[k] !== next[k]) console.log(k);
  // }
});
