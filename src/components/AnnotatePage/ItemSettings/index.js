import React, { useEffect } from "react";
import { useSelector } from "react-redux";

import { ButtonGroup, Grid, Dropdown, Popup, Button, Input } from "semantic-ui-react";

import CodeSelectorSettings from "./CodeSelectorSettings";
import QuestionFormSettings from "./QuestionFormSettings";
import UnitSelectionSettings from "./UnitSelectionSettings";
import db from "apis/dexie";

export const defaultItemSettings = {
  // this is imported in AnnotatePage for technical reasons, but defined here for clarity
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
    validCodes: null,
    highlightAnnotation: false,
    update: 0, // just increments when update button is pressed
  },
  taskType: "annotate",
  codeSelector: {
    type: "recent",
    searchBox: true,
    rowSize: 5,
  },
  questionForm: {
    type: "search code",
    question: "Assign",
    useFolded: true,
  },
  codeMap: null,
};

const ItemSettings = ({
  codingjob,
  itemSettings,
  setItemSettings,
  totalItems,
  codingjobLoaded,
}) => {
  //const codingjob = useSelector((state) => state.codingjob);
  const mode = useSelector((state) => state.mode);
  const codeMap = useSelector((state) => state.codeMap);

  const setItemSetting = (which) => {
    // creates a set state function for a specific key in itemSettings
    // setItemSetting('textUnit') returns a function for setting itemSettings.textUnit
    return (value) => setItemSettings((current) => ({ ...current, [which]: value }));
  };

  useEffect(() => {
    if (!codingjob) return null;
    codingjobLoaded.current = false;
    getCodingjobSettings(codingjob, setItemSettings, codingjobLoaded);
  }, [codingjob, setItemSettings, codingjobLoaded]);

  useEffect(() => {
    if (codingjobLoaded.current) {
      db.setCodingjobProp(codingjob, "itemSettings", itemSettings);
    }
  }, [codingjob, itemSettings, codingjobLoaded]);

  useEffect(() => {
    const validCodes = Object.keys(codeMap).reduce((codes, code) => {
      if (codeMap[code].active && codeMap[code].activeParent) codes.push(code);
      return codes;
    }, []);
    if (itemSettings.unitSelection.value === "per annotation")
      setItemSettings((current) => ({
        ...current,
        unitSelection: { ...current.unitSelection, validCodes: validCodes },
      }));
  }, [codeMap, itemSettings.unitSelection.value, setItemSettings]);

  const designButtons = () => {
    const taskDependent = () => {
      switch (itemSettings.taskType) {
        case "annotate":
          return (
            <CodeSelectorSettings
              codeSelector={itemSettings.codeSelector}
              setCodeSelector={setItemSetting("codeSelector")}
            />
          );
        case "question":
          return (
            <QuestionFormSettings
              questionForm={itemSettings.questionForm}
              setQuestionForm={setItemSetting("questionForm")}
              unitSelection={itemSettings.unitSelection}
            />
          );
        default:
          return null;
      }
    };

    return (
      <Grid.Column>
        <ButtonGroup compact>
          <TextUnitDropdown textUnit={itemSettings.textUnit} setItemSettings={setItemSettings} />
          <ContextUnitDropdown
            textUnit={itemSettings.textUnit}
            contextUnit={itemSettings.contextUnit}
            setContextUnit={setItemSetting("contextUnit")}
          />

          <UnitSelectionSettings
            totalItems={totalItems.current}
            unitSelection={itemSettings.unitSelection}
            setItemSettings={setItemSettings}
          />
          {/* <SamplePopup unitSelection={unitSelection} sample={sample} setSample={setSample} /> */}

          <TaskTypeDropdown
            taskType={itemSettings.taskType}
            setTaskType={setItemSetting("taskType")}
          />
          {taskDependent()}
        </ButtonGroup>
      </Grid.Column>
    );
  };

  if (mode !== "design") return null;
  return designButtons();
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

const getCodingjobSettings = async (codingjob, setItemSettings, codingjobLoaded) => {
  const itemSettings = await db.getCodingjobProp(codingjob, "itemSettings");
  codingjobLoaded.current = true;
  if (itemSettings) setItemSettings(itemSettings);
};

export default React.memo(ItemSettings);
