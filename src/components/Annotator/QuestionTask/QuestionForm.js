import React, { useState, useEffect, useRef } from "react";
import { useDispatch } from "react-redux";
import { Header, Button, Segment } from "semantic-ui-react";
import { setQuestionIndex, setMoveUnitIndex, setAnnotations } from "actions";
import { SearchBoxDropdown, ButtonSelection, Annotinder } from "./QuestionForms";

const QuestionForm = ({ itemBundle, questions, questionIndex, preview, swipe }) => {
  const [answerTransition, setAnswerTransition] = useState();
  const dispatch = useDispatch();
  const answered = useRef(false); // to prevent answering double (e.g. with swipe events)

  useEffect(() => {
    answered.current = false;
  }, [itemBundle]);

  if (!questions || !itemBundle) return null;

  const question = prepareQuestion(itemBundle, questions[questionIndex]);
  const currentAnswer = getCurrentAnswer(itemBundle);

  const onSelect = (answer) => {
    // write result to IDB/server and skip to next question or next item
    if (answered.current) return null;
    answered.current = true;
    setNewAnswer(itemBundle, questionIndex, answer.code, dispatch);
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

const setNewAnswer = (itemBundle, questionIndex, answer, dispatch) => {
  const newAnnotations = { ...itemBundle.annotations };

  const question = itemBundle.codebook.questions[questionIndex].name;
  const group = questionIndex + ": " + question;

  const section = itemBundle.tokens.reduce((obj, token) => {
    if (token.codingUnit && !obj[token.section]) obj[token.section] = 1;
    return obj;
  }, {});

  const span = itemBundle.textUnitSpan;
  const annotation = {
    question,
    questionIndex,
    value: answer,
    section: Object.keys(section).join("+"),
    offset: span[0],
    length: span[1] - span[0],
  };

  if (!newAnnotations["span"]["unit"]) newAnnotations["span"]["unit"] = {};
  newAnnotations["span"]["unit"][group] = annotation;
  dispatch(setAnnotations({ ...newAnnotations }));
};

const getCurrentAnswer = (itemBundle) => {
  // this needs to be 10x prettier or something
  return itemBundle.annotations[itemBundle.textUnit]?.[itemBundle.unitIndex]?.["unit"]?.answer;
};

const showCurrent = (currentAnswer) => {
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
          You answered <b>{`${currentAnswer}`}</b>
        </div>
      </Segment>
    </div>
  );
};

const prepareQuestion = (itemBundle, questions) => {
  let question = questions.question;

  if (question.search("\\[code\\]") >= 0) {
    if (itemBundle.annotation) {
      let code = itemBundle.annotation.group;
      const codeTag = `{{lightyellow###${code}}}`; // add optional color from itemquestions
      question = question.replace("[code]", codeTag);
    }
  }

  return markedString(question);
};

const markedString = (text) => {
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
