import React, { useEffect, useState } from "react";
import { useDispatch } from "react-redux";

import { Popup, Button, Input, Form, Icon, Radio, Checkbox } from "semantic-ui-react";

import Help from "./Help";
import { blockEvents } from "../actions";

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

const UnitSelection = ({ unitSelection, setItemSettings }) => {
  const dispatch = useDispatch();

  useEffect(() => {
    return () => {
      dispatch(blockEvents(false));
    };
  }, [dispatch]);

  return (
    <Popup
      flowing
      hoverable
      wide
      mouseLeaveDelay={10000000} // just don't use mouse leave
      onOpen={() => dispatch(blockEvents(true))}
      onClose={() => dispatch(blockEvents(false))}
      position="bottom left"
      on="click"
      style={{ minWidth: "25em" }}
      trigger={
        <Button style={buttonStyle}>{buttonLabel(unitSelection.value, "Unit selection")}</Button>
      }
    >
      <UnitForm unitSelection={unitSelection} setItemSettings={setItemSettings} />
      <SampleForm unitSelection={unitSelection} setItemSettings={setItemSettings} />
    </Popup>
  );
};

const UnitForm = ({ unitSelection, setItemSettings }) => {
  const onUnitSelection = (e, d) => {
    setItemSettings(current => ({
      ...current,
      unitSelectionSettings: { ...current.unitSelectionSettings, value: d.value, n: null },
    }));
  };

  return (
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
                  onClick={() => setItemSettings(old => ({ ...old }))}
                  style={{ margin: "0", padding: "0.2em", floated: "right" }}
                >
                  Update
                </Button>
              }
            >
              <p>
                New annotations that you made in the current session are not immediately added to
                the unit selection. Click here to update. <br />
                <br />
                Beware that if the current unit selection is sampled or shuffled, this will change
                the current selection.
              </p>
            </Popup>
          ) : null}
        </Form.Field>
        <Form.Field width={10}></Form.Field>
      </Form.Group>
      <br />
    </Form>
  );
};

const SampleForm = React.memo(({ unitSelection, setItemSettings }) => {
  const [delayed, setDelayed] = useState(null); // delayed unitSelectionSettings
  const [pct, setPct] = useState(100);

  useEffect(() => {
    setPct(Math.round((100 * unitSelection.n) / unitSelection.totalItems));
    if (unitSelection.seed == null) unitSelection.seed = 42;

    setDelayed(unitSelection);
  }, [unitSelection, setDelayed]);

  useEffect(() => {
    if (delayed === unitSelection) return null;
    const timer = setTimeout(() => {
      setItemSettings(current => ({ ...current, unitSelectionSettings: delayed }));
    }, 500);
    return () => clearTimeout(timer);
  }, [delayed, unitSelection, setItemSettings]);

  const onChangeMix = (e, d) => {
    setDelayed(current => ({ ...current, annotationMix: Number(d.value) }));
  };

  const onChangeSeed = (e, d) => {
    setDelayed(current => ({ ...current, seed: Number(d.value) }));
  };

  const onChangeShuffle = (e, d) => {
    setDelayed(old => ({ ...old, ordered: !d.checked }));
  };

  const onChangeBalanceDoc = (e, d) => {
    setDelayed(old => ({ ...old, balanceDocuments: d.checked }));
  };
  const onChangeBalanceAnn = (e, d) => {
    setDelayed(old => ({ ...old, balanceAnnotations: d.checked }));
  };

  const onChangeN = (e, d) => {
    let value = Number(d.value);
    //value = value > n ? Math.min(unitSelection.totalItems, value + 4) : Math.max(0, value - 4);
    setPct(Math.round((100 * value) / unitSelection.totalItems));
    setDelayed(current => ({ ...current, n: value }));
  };

  const onChangePCT = (e, d) => {
    let value = Number(d.value);
    //value = value > pct ? Math.min(100, value + 4) : Math.max(0, value - 4);
    let valueN = Math.ceil((value / 100) * unitSelection.totalItems);
    if (valueN >= 0) {
      setPct(value);
      setDelayed(current => ({ ...current, n: valueN }));
    }
  };

  if (delayed === null) return null;

  return (
    <Form>
      <Form.Group>
        <Icon name="setting" />
        <label>Sample</label>
        {/* <Help header={"test"} texts={["test", "this"]} /> */}
      </Form.Group>

      <Form.Group>
        <Form.Field width={3}>
          <label>Shuffle</label>
          <Checkbox
            toggle
            size="mini"
            checked={!unitSelection.ordered}
            onChange={onChangeShuffle}
          />
        </Form.Field>
        <Form.Field
          width={5}
          min={1}
          max={unitSelection.totalItems}
          label="N"
          size="mini"
          control={Input}
          type="number"
          value={delayed.n}
          onChange={onChangeN}
        />
        <Form.Field
          width={5}
          min={0}
          step={5}
          max={100}
          label="%"
          size="mini"
          control={Input}
          type="number"
          value={pct}
          onChange={onChangePCT}
        />

        <Form.Field width={5}>
          <label>Seed</label>
          <Input size="mini" type="number" min={1} value={delayed.seed} onChange={onChangeSeed} />
        </Form.Field>
        <Help
          header={"Sampling and shuffling"}
          texts={[
            "If % < 100, a random sample will be drawn.",
            "If shuffle is enabled, the order of the units will be randomized.",
            "Seed initializes the random number generator. Simply put, using the same seed gives the same 'random' results if the data is the same.",
          ]}
        />
      </Form.Group>

      <Form.Group>
        <Form.Field width={5}>
          <b>Balance</b>
          <Help
            header={"Balanced sampling"}
            texts={[
              "Balance sampled items evenly over groups. Uses a simple approach where unique groups are created (documents, codes, or documentsXcodes), and samples are drawn from these groups one by one",
              "For documents: get an equal number of paragraphs, sentences or annotations per document",
              "For codes: if units are annotations, get an equal number annotations for each unique code. (You can toggle which codes to include in the codebook, see top-right corner)",
            ]}
          />
        </Form.Field>
        <Form.Field width={5}>
          <Checkbox
            size="mini"
            label="documents"
            checked={unitSelection.balanceDocuments}
            onChange={onChangeBalanceDoc}
          />
        </Form.Field>
        <Form.Field>
          <Checkbox
            disabled={unitSelection.value !== "per annotation"}
            size="mini"
            label="codes"
            checked={unitSelection.balanceAnnotations}
            onChange={onChangeBalanceAnn}
          />
        </Form.Field>
      </Form.Group>

      <Form.Group inline>
        <label style={{ color: unitSelection.value.includes("annotation") ? "black" : "grey" }}>
          Add random units
        </label>
        <Help
          header={"Add random annotations"}
          texts={[
            "Add random text units, 'annotated' with random codes",
            "The random codes can be usefull in coding question, such as 'does this text contain [label]",
            "If codes are balanced, a balance of all active codes from the codebook is used. If not, it will approximate the distribution of the codes in the actuall annotations in the sample",
          ]}
        />
        <Form.Field width={4}>
          <Input
            disabled={!unitSelection.value.includes("annotation")}
            min={0}
            step={10}
            size="mini"
            type="number"
            value={delayed.annotationMix}
            onChange={onChangeMix}
          />
        </Form.Field>
        <label style={{ color: unitSelection.value.includes("annotation") ? "black" : "grey" }}>
          % of {unitSelection.value === "has annotation" ? "units with annotation" : "annotations"}
        </label>
      </Form.Group>
    </Form>
  );
});

export default UnitSelection;
