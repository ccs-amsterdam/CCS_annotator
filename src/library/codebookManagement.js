import { standardizeCodes } from "ccs-annotator-client";

/**
 * Transform the taskSettings into the codebook. The difference is that taskSettings also contains information that's only relevant in the manager. The codebook contains only the information relevant for the annotator
 *  Also removes other information that's only relevant for the manager
 * @param {*} taskSettings
 */
export const getCodebook = (taskSettings) => {
  const codebook = {
    type: taskSettings.type,
    ...taskSettings[taskSettings.type],
  };

  if (taskSettings.type === "annotate") {
    codebook.variables = [
      ...codebook.variables.filter((v) => v.enabled == null || v.enabled === true),
    ];
    codebook.variables = codebook.variables.map((v) => {
      const variable = { ...v };
      if (variable.singleCode) variable.codes = ["true"];
      variable.codes = standardizeCodes(variable.codes);
      return variable;
    });
  }

  if (taskSettings.type === "questions") {
    codebook.questions = codebook.questions.map((q) => {
      const question = { ...q };
      question.codes = standardizeCodes(question.codes);
      return question;
    });
  }

  return codebook;
};

export const ctaToText = (cta, indentSpaces = 2, paramOffset = 25) => {
  let txt = "";
  let line;
  for (let code of cta) {
    line = "";
    line += Array(1 + code.level * indentSpaces).join(" ");
    line += code.code;

    const addSpace = paramOffset - line.length;
    if (addSpace > 0) line += Array(addSpace).join(" ");
    line += ` #color(${code.color})`;
    if (!code.active) line += " #disabled";
    if (code.folded) line += " #folded";
    if (code.makes_irrelevant && code.makes_irrelevant.length > 0)
      line += ` #irrelevant(${code.makes_irrelevant.join(",")})`;
    txt += line + "\n";
  }
  return txt;
};

export const textToCodes = (text, root, codes, frozen) => {
  const codeMap = codes.reduce((obj, code) => {
    if (typeof code === "object") {
      obj[code.code] = 1;
      obj[code.parent] = 1;
    } else obj[code] = 1;
    return obj;
  }, {});
  const duplicates = [];
  const updatedCodes = [...codes];
  const parentLevel = {};
  const lines = text.split("\n");
  for (let line of lines) {
    const spaces = line.search(/\S/);

    let newCode = line;
    for (let flag of ["color", "disabled", "folded", "irrelevant"]) {
      newCode = newCode.split(`#${flag}`)[0].trim();
    }
    if (newCode === "") continue;
    if (codeMap[newCode]) duplicates.push(newCode);
    codeMap[newCode] = 1;

    const newCodeObj = {
      code: newCode,
      frozen: frozen.some((c) => c.code === newCode),
      parent: findParent(parentLevel, root, newCode, spaces),
      active: !line.includes("#disabled"),
      folded: line.includes("#folded"),
    };

    if (line.includes("#irrelevant")) {
      const irrelevantString = line.split("#irrelevant(")[1].split(")")[0];
      newCodeObj.makes_irrelevant = irrelevantString.split(",");
    }
    if (line.includes("#color")) {
      let color = line.split("#color(")[1].split(")")[0];
      newCodeObj.color = standardizeColor(color);
    }
    updatedCodes.push(newCodeObj);
  }

  for (let code of frozen) {
    if (updatedCodes.some((e) => e.code === code.code)) continue;
    code.parent = "";
    updatedCodes.push(code);
  }

  return [updatedCodes, duplicates];
};

const findParent = (parentLevel, code, newCode, spaces) => {
  // also updates parentLevel
  let parent = code;
  for (let pspaces of Object.keys(parentLevel)) {
    pspaces = Number(pspaces);
    if (spaces > pspaces) {
      parent = parentLevel[pspaces];
    } else {
      delete parentLevel[pspaces];
      parentLevel[spaces] = newCode;
    }
  }
  parentLevel[spaces] = newCode;
  return parent;
};

const standardizeColor = (str) => {
  if (!str) return "#FFFFFF";
  // https://stackoverflow.com/questions/1573053/javascript-function-to-convert-color-names-to-hex-codes
  const ctx = document.createElement("canvas").getContext("2d");
  ctx.fillStyle = str.trim();
  const color = ctx.fillStyle; // make lighter
  return color;
};
