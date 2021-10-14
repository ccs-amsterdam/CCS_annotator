import React, { useState, useEffect, useRef } from "react";
import { useDispatch } from "react-redux";
import { Header, Button, Segment } from "semantic-ui-react";
import { setQuestionIndex, setMoveUnitIndex } from "actions";
import { SearchBoxDropdown, ButtonSelection, Annotinder } from "./QuestionForms";

const QuestionForm = ({ unit, tokens, questions, questionIndex, preview, swipe }) => {
  const [answerTransition, setAnswerTransition] = useState();
  const dispatch = useDispatch();
  const answered = useRef(false); // to prevent answering double (e.g. with swipe events)

  useEffect(() => {
    answered.current = false;
  }, [unit]);

  console.log(unit);
  if (!questions || !unit) return null;

  const question = prepareQuestion(unit, questions[questionIndex]);
  const annotationObject = createAnnotationObject(tokens, questions[questionIndex], questionIndex);
  const currentAnswer = getCurrentAnswer(unit.annotations, annotationObject);

  const onSelect = answer => {
    // write result to IDB/server and skip to next question or next item
    if (answered.current) return null;
    if (!annotationObject) return null;
    answered.current = true;

    annotationObject.value = answer.code;
    unit.post(unit.unitId, [annotationObject]);

    setAnswerTransition(answer); // show given answer
    setTimeout(() => {
      // wait a little bit, so coder can confirm their answer
      setAnswerTransition(null);
      if (questionIndex === questions.length - 1) {
        dispatch(setMoveUnitIndex("next"));
        dispatch(setQuestionIndex(0));
      } else {
        dispatch(setQuestionIndex(questionIndex + 1));
      }
    }, 250);
  };

  return (
    <div
      style={{
        display: "flex",
        flexFlow: "column",
        height: "100%",
        width: "100%",
        maxHeight: "100%",
        padding: "1em",
        color: "white",
        borderTop: "5px double grey",
        backgroundColor: "#1B1C1D",
      }}
    >
      <div style={{ width: "100%", flex: "1 1 auto" }}>
        <QuestionIndexStep questions={questions} questionIndex={questionIndex} />
        <Header as="h3" style={{ color: "white" }}>
          {questions[questionIndex].name}
        </Header>
      </div>
      {question}
      <AnswerSegment
        answerTransition={answerTransition}
        currentAnswer={currentAnswer}
        questions={questions}
        questionIndex={questionIndex}
        onSelect={onSelect}
        preview={preview}
        swipe={swipe}
      />
    </div>
  );
};

const QuestionIndexStep = ({ questions, questionIndex }) => {
  if (questions.length === 1) return null;
  return (
    <Button.Group style={{ marginLeft: "1em", marginTop: "0", float: "right" }}>
      {questions.map((q, i) => {
        return (
          <Button
            active={i === questionIndex}
            style={{ padding: "0.2em", minWidth: "1.3em", background: "grey", color: "white" }}
          >
            {i + 1}
          </Button>
        );
      })}
    </Button.Group>
  );
};

const AnswerSegment = ({
  answerTransition,
  currentAnswer,
  questions,
  questionIndex,
  onSelect,
  preview,
  swipe,
}) => {
  if (answerTransition)
    return (
      <Segment
        style={{
          flex: "1 1 auto",
          padding: "0",
          overflowY: "auto",
          height: "100%",
          width: "100%",
          margin: "0",
          background: answerTransition.color,
          textAlign: "center",
        }}
      >
        <Header as="h1">{answerTransition.code}</Header>
      </Segment>
    );
  return (
    <>
      {showCurrent(currentAnswer || answerTransition)}
      <Segment
        style={{
          flex: "1 1 auto",
          padding: "0",
          overflowY: "auto",
          height: "100%",
          width: "100%",
          margin: "0",
        }}
      >
        {questions[questionIndex].type === "search code" ? (
          <SearchBoxDropdown options={questions[questionIndex].options} callback={onSelect} />
        ) : null}
        {questions[questionIndex].type === "select code" ? (
          <ButtonSelection
            options={questions[questionIndex].options}
            callback={onSelect}
            preview={preview}
          />
        ) : null}
        {questions[questionIndex].type === "annotinder" ? (
          <Annotinder
            swipeOptions={questions[questionIndex].swipeOptions}
            currentAnswer={currentAnswer}
            callback={onSelect}
            preview={preview}
            swipe={swipe}
          />
        ) : null}
      </Segment>
    </>
  );
};

const createAnnotationObject = (tokens, question, questionIndex) => {
  // creates an object with all information about the annotation except for the
  // value. This lets us check whether the annotations already exists, and add
  // or change the value.
  if (tokens.length === 0) return null;

  const sections = {};
  const lastToken = tokens[tokens.length - 1];

  const charspan = [0, lastToken.offset + lastToken.length];
  const indexspan = [0, tokens.length];
  let [unitStarted, unitEnded] = [false, false];

  let i = 0;
  for (let token of tokens) {
    if (token.codingUnit && !sections[token.section]) sections[token.section] = 1;
    if (!unitStarted && token.codingUnit) {
      unitStarted = true;
      charspan[0] = token.offset;
      indexspan[0] = i;
    }
    if (!unitEnded && !token.codingUnit && unitStarted) {
      unitEnded = true;
      charspan[1] = token.offset + token.length;
      indexspan[1] = i;
    }
    i++;
  }

  const extras = {};
  // make these optional? Because they're not tokenizer agnostic
  // also only make sense if text_units include all offsets
  // maybe only include IF the offsets are set, OR if offset === 0
  extras.token_start = tokens[0].index;
  extras.token_end = tokens[1].index;
  extras.paragraph_start = tokens[0].paragraph;
  extras.paragraph_end = tokens[1].paragraph;
  extras.sentence_start = tokens[0].sentence;
  extras.sentence_end = tokens[1].sentence;

  return {
    variable: `${questionIndex + 1}: ${question.name}`,
    value: null,
    section: Object.keys(sections).join(" + "),
    offset: charspan[0],
    length: charspan[1] - charspan[0],
    ...extras,
  };
};

const getCurrentAnswer = (annotations, annotationObject) => {
  console.log(annotations);
  if (!annotations) return null;
  for (let annotation of annotations) {
    console.log(annotation);
    console.log(annotationObject);
    if (
      annotation.variable === annotationObject.variable &&
      annotation.section === annotationObject.section &&
      annotation.offset === annotationObject.offset &&
      annotation.length === annotationObject.length
    )
      return annotation.value;
  }
  return null;
};

const showCurrent = currentAnswer => {
  if (currentAnswer == null) return null;
  return (
    <div style={{ backgroundColor: "white", color: "black" }}>
      <Segment
        style={{
          padding: "0.2em",
          margin: "0",
          textAlign: "center",
        }}
      >
        <div style={{ fontSize: "1.5em", marginTop: "0.3em" }}>
          current answer: <b>{`${currentAnswer}`}</b>
        </div>
      </Segment>
    </div>
  );
};

const prepareQuestion = (unit, question) => {
  let preparedQuestion = question.question;

  if (preparedQuestion.search("\\[code\\]") >= 0) {
    if (unit.annotation) {
      let code = unit.annotation.value;
      const codeTag = `{{lightyellow###${code}}}`; // add optional color from itemquestions
      preparedQuestion = preparedQuestion.replace("[code]", codeTag);
    }
  }

  return markedString(preparedQuestion);
};

const markedString = text => {
  const regex = new RegExp(/{{(.*?)}}/); // Match text inside two square brackets

  text = text.replace(/(\r\n|\n|\r)/gm, "");
  return (
    <div>
      {text.split(regex).reduce((prev, current, i) => {
        if (i % 2 === 0) {
          prev.push(current);
        } else {
          const [color, string] = current.split("###");
          prev.push(
            <mark key={i + current} style={{ backgroundColor: color }}>
              {string}
            </mark>
          );
        }
        return prev;
      }, [])}
    </div>
  );
};

export default React.memo(QuestionForm);
