import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";

import {
  Breadcrumb,
  BreadcrumbSection,
  ButtonGroup,
  Grid,
  Dropdown,
  Popup,
  Button,
  Input,
  Form,
  Icon,
  Radio,
  Checkbox,
} from "semantic-ui-react";

import CodingjobSelector from "./CodingjobSelector";
import Help from "./Help";
import AnnotationPage from "./AnnotationPage";
import db from "../apis/dexie";
import ItemSelector from "./ItemSelector";
import { blockEvents } from "../actions";

const UNITSELECTIONDEFAULT = {
  value: "all",
  annotationMix: 0,
  n: null,
  seed: 42,
  ordered: true,
};

const Annotate = () => {
  const codingjob = useSelector((state) => state.codingjob);
  const mode = useSelector((state) => state.mode);

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
    if (!codingjob) return null;
    setupCodingjob(
      codingjob,
      textUnit,
      unitSelectionSettings,
      setJobItem,
      setJobItems,
      setUnitSelection
    );
  }, [codingjob, textUnit, unitSelectionSettings, setJobItem, setJobItems, setUnitSelection]);

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

          <UnitSelectionPopup
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
        {`token ${jobItem.annotation.span[0] + 1}-${jobItem.annotation.span[1] + 1}`}
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
        {/* <Dropdown.Item onClick={() => setTaskType("question based")}>Edit labels</Dropdown.Item>
        <Dropdown.Item onClick={() => setTaskType("question based")}>Validate labels</Dropdown.Item>
        <Dropdown.Item onClick={() => setTaskType("question based")}>
          Question per label
        </Dropdown.Item>
        <Dropdown.Item onClick={() => setTaskType("question based")}>
          Question per text
        </Dropdown.Item> */}
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

const UnitSelectionPopup = ({ textUnit, unitSelection, setUnitSelectionSettings }) => {
  //unitSelection.includes("annotation")

  const dispatch = useDispatch();
  const [n, setN] = useState(unitSelection.n);
  const [mix, setMix] = useState(0);
  const [seed, setSeed] = useState(unitSelection.seed);
  const [pct, setPct] = useState(100);

  useEffect(() => {
    setSeed(unitSelection.seed);
    setN(unitSelection.totalItems);
    setPct(100);
    setMix(unitSelection.mix);
  }, [
    textUnit,
    unitSelection.totalItems,
    unitSelection.value,
    unitSelection.seed,
    unitSelection.mix,
  ]);

  useEffect(() => {
    return () => {
      dispatch(blockEvents(false));
    };
  }, [dispatch]);

  useEffect(() => {
    if (unitSelection.n === n && unitSelection.annotationMix === mix && unitSelection.seed === seed)
      return null;
    const timer = setTimeout(() => {
      setUnitSelectionSettings((old) => ({ ...old, n: n, annotationMix: mix, seed: seed }));
    }, 500);
    return () => clearTimeout(timer);
  }, [n, mix, seed, setUnitSelectionSettings, unitSelection]);

  const onUnitSelection = (e, d) => {
    setUnitSelectionSettings((old) => ({ ...old, value: d.value, n: null }));
  };

  const onChangeMix = (e, d) => {
    setMix(Number(d.value));
  };

  const onChangeSeed = (e, d) => {
    setSeed(Number(d.value));
  };

  const onChangeShuffle = (e, d) => {
    setUnitSelectionSettings((old) => ({ ...old, ordered: !d.checked }));
  };

  const onChangeN = (e, d) => {
    setN(Number(d.value));
    setPct(Math.round((100 * d.value) / unitSelection.totalItems));
  };
  const onChangePCT = (e, d) => {
    const value = Math.ceil((d.value / 100) * unitSelection.totalItems);
    if (value > 0) {
      setPct(d.value);
      setN(value);
    }
  };

  return (
    <Popup
      flowing
      hoverable
      wide
      onOpen={() => dispatch(blockEvents(true))}
      onClose={() => dispatch(blockEvents(false))}
      position="bottom left"
      on="click"
      style={{ minWidth: "20em" }}
      trigger={
        <Button style={buttonStyle}>{buttonLabel(unitSelection.value, "Unit selection")}</Button>
      }
    >
      <Form>
        <Form.Group>
          <Icon name="setting" />
          <label>Unit selection</label>
        </Form.Group>
        <Form.Group grouped>
          <Form.Field>
            <Radio
              value="all"
              label="All texts"
              checked={unitSelection.value === "all"}
              onChange={onUnitSelection}
            />
            <Help header={"All texts"} texts={["Use all unique text units"]} />
          </Form.Field>

          {/* <Form.Field>
            <Radio
              value="has annotation"
              label="texts with annotations"
              checked={unitSelection.value === "has annotation"}
              onChange={onUnitSelection}
            />
            <Help
              header={"Texts with annotations"}
              texts={
                ["Use text units that have at least annotation. Random units without annotation can be added in the sample"]
              }
            />
          </Form.Field> */}

          <Form.Field>
            <Radio
              value="per annotation"
              label="By annotation"
              checked={unitSelection.value === "per annotation"}
              onChange={onUnitSelection}
            />
            <Help
              header={"By annotation"}
              texts={[
                "Select text units based on annotations. Only text units with at least one annotation will be used*, and a text unit can appear multiple times if it has multiple annotations.",
                "The annotation label can also be used in a 'question based' task. This can for instance be used to ask a coder whether [label] occurs in the text unit.",
                "*random units without any annotations can be added in the sample.",
              ]}
            />
            {unitSelection.value === "per annotation" ? (
              <Popup
                position="right center"
                trigger={
                  <Button
                    floated="right"
                    style={{ margin: "0", padding: "0.2em", floated: "right" }}
                  >
                    Update
                  </Button>
                }
              >
                <p>
                  Check if new annotations have been added. Beware that this will change the current
                  unit selection if units are shuffled or a sample is drawn
                </p>
              </Popup>
            ) : null}
          </Form.Field>
        </Form.Group>
        <br />
      </Form>
      <Form>
        <Form.Group>
          <Icon name="setting" />
          <label>Sample</label>
          {/* <Help header={"test"} texts={["test", "this"]} /> */}
        </Form.Group>

        <Form.Group>
          <Form.Field
            width={5}
            min={0}
            max={unitSelection.totalItems}
            step={5}
            label="N"
            size="mini"
            control={Input}
            type="number"
            value={n}
            onChange={onChangeN}
          />
          <Form.Field
            width={5}
            min={0}
            max={100}
            step={5}
            label="%"
            size="mini"
            control={Input}
            type="number"
            value={pct}
            onChange={onChangePCT}
          />
          <Form.Field width={3}>
            <label>Shuffle</label>
            <Checkbox
              toggle
              size="mini"
              checked={!unitSelection.ordered}
              onChange={onChangeShuffle}
            />
          </Form.Field>
          <Help
            header={"Sampling and shuffling"}
            texts={[
              "If % < 100, a random sample will be drawn.",
              "If shuffle is enabled, the order of the units will be randomized.",
            ]}
          />
        </Form.Group>

        <Form.Group>
          <Form.Field width={5}>
            <label>Seed</label>
            <Input size="mini" type="number" min={1} value={seed} onChange={onChangeSeed} />
          </Form.Field>
          <Help
            header={"Random seed"}
            texts={[
              "Choose a random seed for drawing the sample and/or shuffling the order",
              "Simply put, using the same seed will give the same random results if the data is the same. Change this if you want an alternative random selection/order.",
            ]}
          />
        </Form.Group>
        <label style={{ color: unitSelection.value.includes("annotation") ? "black" : "grey" }}>
          Random text units without annotation
        </label>
        <Form.Group inline>
          <Form.Field
            disabled={!unitSelection.value.includes("annotation")}
            width={4}
            min={0}
            step={5}
            size="mini"
            control={Input}
            type="number"
            value={mix}
            onChange={onChangeMix}
          />
          <label style={{ color: unitSelection.value.includes("annotation") ? "black" : "grey" }}>
            % of{" "}
            {unitSelection.value === "has annotation" ? "units with annotation" : "annotations"}
          </label>
        </Form.Group>
      </Form>
    </Popup>
  );
};

const setupCodingjob = async (
  codingjob,
  textUnit,
  unitSelectionSettings,
  setJobItem,
  setJobItems,
  setUnitSelection
) => {
  let [totalItems, items] = await db.getCodingjobItems(codingjob, textUnit, unitSelectionSettings);
  setJobItems(items);
  setJobItem(items[0]);
  setUnitSelection({ ...unitSelectionSettings, totalItems: totalItems });
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
