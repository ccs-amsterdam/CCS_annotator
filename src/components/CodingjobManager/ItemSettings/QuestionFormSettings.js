import React, { useEffect, useState } from "react";

import { Form, Radio, TextArea } from "semantic-ui-react";

import Help from "components/Help";

const QuestionFormSettings = ({ questionForm, setQuestionForm, unitSelection }) => {
  const [delayed, setDelayed] = useState("");
  const [warn, setWarn] = useState([]);

  useEffect(() => {
    if (!delayed) return;
    if (questionForm.name === delayed.name && questionForm.question === delayed.question) return;
    const timer = setTimeout(() => {
      setQuestionForm({ ...questionForm, name: delayed.name, question: delayed.question });
    }, 500);
    return () => clearTimeout(timer);
  }, [delayed, questionForm, setQuestionForm]);

  useEffect(() => {
    let newWarn = [];

    const hasCodeRef = questionForm.question.search("\\[code\\]") >= 0;
    const hasTextRef = questionForm.question.search("\\[text\\]") >= 0;

    if (hasCodeRef && unitSelection.value === "all")
      newWarn.push(
        "Referring to a specific code with [code] is only possible if coding units are annotations"
      );
    if (hasTextRef) {
      if (unitSelection.value === "per annotation" && unitSelection.annotationMix > 0) {
        newWarn.push(
          `Referring to the specific [text] of an annotation is not possible if random units are added to the sample (because picking random words would make no sense... I think). This percentage (currently ${unitSelection.annotationMix}%) can be set in the Unit selection menu.`
        );
      } else {
        if (unitSelection.value === "all")
          newWarn.push(
            "Reffering to the specific [text] of an annotation is only possible if coding units are annotations"
          );
      }
    }

    setWarn(newWarn);
    setDelayed({ name: questionForm.name, question: questionForm.question });
  }, [setDelayed, questionForm, setWarn, unitSelection]);
  console.log(warn);

  if (!questionForm) return null;

  return (
    <Form>
      <Form.Group grouped>
        <label>Name</label>
        <Form.Field>
          <TextArea
            rows={1}
            value={delayed.name}
            onChange={(e, d) => setDelayed({ ...delayed, name: d.value })}
          />
        </Form.Field>{" "}
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
          <TextArea
            value={delayed.question}
            onChange={(e, d) => setDelayed({ ...delayed, question: d.value })}
          />
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
        </Form.Field>
      </Form.Group>
    </Form>
  );
};

export default QuestionFormSettings;
