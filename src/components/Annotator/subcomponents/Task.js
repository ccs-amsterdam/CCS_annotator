import React from "react";
import QuestionTask from "components/Annotator/QuestionTask";
import AnnotateTask from "components/Annotator/AnnotateTask";

const Task = ({ unit, setUnitIndex, fullScreenNode }) => {
  const codebook = unit?.jobServer?.codebook;
  if (!codebook || !unit) return null;

  const renderTaskPreview = (type) => {
    switch (type) {
      case "questions":
        return (
          <QuestionTask
            unit={unit}
            codebook={codebook}
            setUnitIndex={setUnitIndex}
            fullScreenNode={fullScreenNode}
          />
        );
      case "annotate":
        return (
          <AnnotateTask
            unit={unit}
            codebook={codebook}
            setUnitIndex={setUnitIndex}
            fullScreenNode={fullScreenNode}
          />
        );
      default:
        return null;
    }
  };

  if (!codebook?.type) return null;
  return renderTaskPreview(codebook.type);
};

export default Task;
