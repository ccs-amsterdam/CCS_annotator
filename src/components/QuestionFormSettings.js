import React, { useEffect, useState } from "react";
import { useDispatch } from "react-redux";

import { Popup, Button, Input, Form, Radio, Icon, TextArea } from "semantic-ui-react";

import { blockEvents } from "../actions";
import Help from "./Help";

const QuestionFormSettings = ({ questionForm, setQuestionForm, unitSelection }) => {
  const dispatch = useDispatch();
  const [delayedQuestion, setDelayedQuestion] = useState("");
  const [warn, setWarn] = useState([]);

  useEffect(() => {
    if (questionForm.question === delayedQuestion) return;
    const timer = setTimeout(() => {
      setQuestionForm({ ...questionForm, question: delayedQuestion });
    }, 500);
    return () => clearTimeout(timer);
  }, [delayedQuestion, questionForm, setQuestionForm]);

  useEffect(() => {
    let newWarn = [];

    const hasCodeRef = questionForm.question.search("\\[code\\]") >= 0;
    const hasTextRef = questionForm.question.search("\\[text\\]") >= 0;

    if (hasCodeRef && unitSelection.value === "all")
      newWarn.push(
        'Referring to a specific [code] is only possible if unit selection is "by annotation"'
      );
    if (hasTextRef) {
      if (unitSelection.value === "per annotation" && unitSelection.annotationMix > 0) {
        newWarn.push(
          `Referring to the specific [text] of an annotation is not possible if random units are added to the sample (because picking random words would make no sense... I think). This percentage (currently ${unitSelection.annotationMix}%) can be set in the Unit selection menu.`
        );
      } else {
        if (unitSelection.value === "all")
          newWarn.push(
            'Reffering to the specific [text] of an annotation is only possible if unit selection is "by annotation"'
          );
      }
    }

    console.log(newWarn);
    setWarn(newWarn);
    setDelayedQuestion(questionForm.question);
  }, [setDelayedQuestion, questionForm, setWarn, unitSelection]);

  if (!questionForm) return null;

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
        <div>
          {warn.length > 0 ? <Help header="Warning" texts={warn} type={"warn"} /> : null}
          <Button style={buttonStyle}>{buttonLabel(questionForm.type, "Question form")}</Button>
        </div>
      }
    >
      <Form>
        <Form.Group>
          <Icon name="setting" />
          <label>Question form settings</label>
        </Form.Group>

        <Form.Group grouped>
          <label>
            Question
            <Help
              header={"How to ask a question"}
              texts={[
                "Type here the question as it should be displayed to the code",
                "If Units are selected 'per annotation', you can also type [code] to refer to the code label, and [text] to refer to the text of the annotation. (using [text] is not possible if 'add random units' is used)",
              ]}
            />
          </label>
          <Form.Field>
            <TextArea value={delayedQuestion} onChange={(e, d) => setDelayedQuestion(d.value)} />
          </Form.Field>
        </Form.Group>

        <Form.Group grouped>
          <label>Type of answer</label>
          <Form.Field>
            <Radio
              value="search code"
              label="Select code from search box"
              checked={questionForm.type === "search code"}
              onChange={() => setQuestionForm({ ...questionForm, type: "search code" })}
            />
          </Form.Field>
          <Form.Field>
            <Radio
              value="select code"
              label="Select code from buttons"
              checked={questionForm.type === "select code"}
              onChange={() => setQuestionForm({ ...questionForm, type: "select code" })}
            />
            <Help
              header={"Set active codes"}
              texts={[
                "You can toggle which codes are active in the codebook (top-right in menu bar)",
              ]}
            />
          </Form.Field>
        </Form.Group>
        <Form.Group>
          <Form.Field>
            <Input
              size="mini"
              min={1}
              max={10}
              value={questionForm.rowSize}
              type="number"
              style={{ width: "6em" }}
              label={"Buttons per row"}
              onChange={(e, d) => setQuestionForm({ ...questionForm, rowSize: d.value })}
            />
          </Form.Field>
        </Form.Group>
      </Form>
    </Popup>
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

export default QuestionFormSettings;
