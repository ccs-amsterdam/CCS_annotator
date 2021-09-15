import React, { useEffect, useState } from "react";
import { useDispatch } from "react-redux";

import { Popup, Button, Form, Radio, Icon, TextArea, Checkbox } from "semantic-ui-react";

import { blockEvents } from "actions";
import Help from "components/Help";

const QuestionFormSettings = ({ questionForm, setQuestionForm, unitSelection }) => {
  const dispatch = useDispatch();
  const [delayedQuestion, setDelayedQuestion] = useState("");
  const [warn, setWarn] = useState([]);

  console.log(unitSelection);

  useEffect(() => {
    let newWarn = [];

    const hasCodeRef = questionForm.question.search("\\[code\\]") >= 0;
    const hasTextRef = questionForm.question.search("\\[text\\]") >= 0;

    if (hasCodeRef && unitSelection.value === "all")
      newWarn.push(
        'Referring to a specific code with [code] is only possible if unit selection is "by annotation"'
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
        <Button style={buttonStyle}>
          {buttonLabel(questionForm.type, "Question form")}
          {warn.length > 0 ? <Help header="Warning" texts={warn} type={"warn"} /> : null}
        </Button>
      }
    >
      <Form>
        <Form.Group>
          <Icon name="setting" />
          <label>Question mode settings</label>
        </Form.Group>

        <Form.Group grouped>
          <label>
            Question
            <Help
              header={"How to ask a question"}
              texts={[
                "Type here the question as it should be displayed to the code",
                "If unit selection is 'per annotation', you can also use the tags [code], [group], and [text]. These will be replaced by information from the annotation",
                "[code] and [group] show the code label. The difference is that [code] always shows the specific label, regardless of whether codes are grouped together in the codebook. [group] shows the code into which a code is grouped, or the code itself if it isn't grouped",
                "[text] shows the text of the annotation. Note that this is not possible if 'add random units' is used",
              ]}
            />
          </label>
          <Form.Field>
            <TextArea value={delayedQuestion} onChange={(e, d) => setDelayedQuestion(d.value)} />
          </Form.Field>
          <Form.Field>
            <Button
              fluid
              disabled={questionForm.question === delayedQuestion}
              onClick={() => setQuestionForm({ ...questionForm, question: delayedQuestion })}
            >
              Apply changes
            </Button>
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
