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

const UnitSelection = ({ textUnit, unitSelection, setUnitSelectionSettings }) => {
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
      style={{ minWidth: "20em" }}
      trigger={
        <Button style={buttonStyle}>{buttonLabel(unitSelection.value, "Unit selection")}</Button>
      }
    >
      <UnitForm unitSelection={unitSelection} setUnitSelectionSettings={setUnitSelectionSettings} />
      <SampleForm
        textUnit={textUnit}
        unitSelection={unitSelection}
        setUnitSelectionSettings={setUnitSelectionSettings}
      />
    </Popup>
  );
};

const UnitForm = ({ unitSelection, setUnitSelectionSettings }) => {
  const onUnitSelection = (e, d) => {
    setUnitSelectionSettings(old => ({ ...old, value: d.value, n: null }));
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
                  onClick={() => setUnitSelectionSettings(old => ({ ...old }))}
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
  );
};

const SampleForm = React.memo(
  ({ textUnit, unitSelection, setUnitSelectionSettings }) => {
    const [n, setN] = useState(0);
    const [mix, setMix] = useState(0);
    const [seed, setSeed] = useState(42);
    const [pct, setPct] = useState(100);

    // useEffect(() => {
    //     // pff... the previous useEffect resets n if unitselection changes
    //     // then this updates it with the totalItems. This way cahnging totalItems doesn't trigger the reset
    //     if (n === null) {
    //       setN(unitSelection.totalItems);
    //       setPct(Math.round((100 * n) / unitSelection.totalItems));
    //       setSeed(unitSelection.seed);
    //       setMix(unitSelection.mix);
    //     }
    //   }, [unitSelection.n, unitSelection.pct, unitSelection.seed, unitSelection.mix]);

    useEffect(() => {
      setN(0);
      setPct(100);
    }, [textUnit, unitSelection.value]);

    useEffect(() => {
      if (
        unitSelection.n === n &&
        unitSelection.annotationMix === mix &&
        unitSelection.seed === seed
      )
        return null;
      const timer = setTimeout(() => {
        setUnitSelectionSettings(old => ({ ...old, n: n, annotationMix: mix, seed: seed }));
      }, 500);
      return () => clearTimeout(timer);
    }, [n, mix, seed, setUnitSelectionSettings, unitSelection]);

    const onChangeMix = (e, d) => {
      let value = Number(d.value);
      //value = value > mix ? value + 4 : Math.max(0, value - 4);
      setMix(Number(value));
    };

    const onChangeSeed = (e, d) => {
      setSeed(Number(d.value));
    };

    const onChangeShuffle = (e, d) => {
      setUnitSelectionSettings(old => ({ ...old, ordered: !d.checked }));
    };
    const onChangeStratify = (e, d) => {
      setUnitSelectionSettings(old => ({ ...old, stratifyDocuments: d.checked }));
    };

    const onChangeN = (e, d) => {
      let value = Number(d.value);
      //value = value > n ? Math.min(unitSelection.totalItems, value + 4) : Math.max(0, value - 4);
      setN(value);
      setPct(Math.round((100 * value) / unitSelection.totalItems));
    };
    const onChangePCT = (e, d) => {
      let value = Number(d.value);
      //value = value > pct ? Math.min(100, value + 4) : Math.max(0, value - 4);
      let valueN = Math.ceil((value / 100) * unitSelection.totalItems);
      if (valueN >= 0) {
        setPct(value);
        setN(valueN > 0 ? valueN : 1);
      }
    };

    return (
      <Form>
        <Form.Group>
          <Icon name="setting" />
          <label>Sample</label>
          {/* <Help header={"test"} texts={["test", "this"]} /> */}
        </Form.Group>

        <Form.Group>
          <Form.Field
            width={5}
            min={1}
            max={unitSelection.totalItems}
            label="N"
            size="mini"
            control={Input}
            type="number"
            value={unitSelection.n}
            onChange={onChangeN}
          />
          <Form.Field
            width={5}
            min={0}
            max={100}
            label="%"
            size="mini"
            control={Input}
            type="number"
            value={unitSelection.pct}
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
          <Form.Field width={10}>
            <label>Stratify documents</label>
            <Checkbox
              toggle
              size="mini"
              checked={!unitSelection.stratifyDocuments}
              onChange={onChangeStratify}
            />
          </Form.Field>
        </Form.Group>
        <label style={{ color: unitSelection.value.includes("annotation") ? "black" : "grey" }}>
          Random text units without annotation
        </label>
        <Form.Group inline>
          <Form.Field
            disabled={!unitSelection.value.includes("annotation")}
            width={5}
            min={0}
            size="mini"
            control={Input}
            type="number"
            value={unitSelection.mix}
            onChange={onChangeMix}
          />
          <label style={{ color: unitSelection.value.includes("annotation") ? "black" : "grey" }}>
            % of{" "}
            {unitSelection.value === "has annotation" ? "units with annotation" : "annotations"}
          </label>
        </Form.Group>
      </Form>
    );
  },
  (prevprops, nextprops) => {
    for (let key of Object.keys(prevprops)) {
      //   console.log(prevprops.unitSelection);
      //   console.log(key);
      //   console.log(prevprops[key] === nextprops[key]);
    }
  }
);

export default UnitSelection;
