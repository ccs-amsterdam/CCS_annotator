import randomColor from "randomcolor";

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
      if (variable.singleCode) variable.codes = standardizeCodes(["true"]);
      return variable;
    });
  }

  return codebook;
};

export const standardizeCodes = (codes) => {
  return codes.map((code, i) => {
    if (typeof code !== "object") code = { code };
    if (code.active == null) code.active = true;
    if (code.tree == null) code.tree = [];
    if (code.parent == null) code.parent = "";
    if (code.makes_irrelevant == null) code.makes_irrelevant = [];
    if (typeof code.makes_irrelevant !== "object") code.makes_irrelevant = [code.makes_irrelevant];

    if (code.required_for == null) code.required_for = [];
    if (typeof code.required_for !== "object") code.required_for = [code.required_for];

    if (code.color == null) code.color = randomColor({ seed: code.code, luminosity: "light" });
    return code;
  });
};

export const codeBookEdgesToMap = (codes) => {
  const standardizedCodes = standardizeCodes(codes);
  // the payload is an array of objects, but for efficients operations
  // in the annotator we convert it to an object with the codes as keys
  const codeMap = standardizedCodes.reduce((result, code) => {
    result[code.code] = {
      ...code,
      children: [],
      totalChildren: 0,
      totalActiveChildren: 0,
    };
    return result;
  }, {});

  // If there are codes of which the parent doesn't exist, add the parent
  const originalKeys = Object.keys(codeMap);
  for (const key of originalKeys) {
    if (codeMap[key].parent !== "" && !codeMap[codeMap[key].parent]) {
      codeMap[codeMap[key].parent] = {
        code: codeMap[key].parent,
        parent: "",
        children: [],
        active: false,
        totalChildren: 0,
        totalActiveChildren: 0,
      };
    }
  }

  for (const code of Object.keys(codeMap)) {
    [codeMap[code].tree, codeMap[code].activeParent, codeMap[code].foldToParent] = parentData(
      codeMap,
      code
    );

    if (codeMap[code].parent) codeMap[codeMap[code].parent].children.push(code);

    for (const parent of codeMap[code].tree) {
      codeMap[parent].totalChildren++;
      if (codeMap[code].active && codeMap[code].activeParent) {
        codeMap[parent].totalActiveChildren++;
      }
    }
  }

  return codeMap;
};

export const getCodeTreeArray = (codeMap, showColors) => {
  let parents = Object.keys(codeMap).filter(
    (code) => !codeMap[code].parent || codeMap[code].parent === ""
  );
  const codeTreeArray = [];
  fillCodeTreeArray(codeMap, parents, codeTreeArray, [], showColors);
  return codeTreeArray.map((object, i) => ({ ...object, i: i }));
};

const fillCodeTreeArray = (codeMap, parents, codeTreeArray, codeTrail, showColors) => {
  for (const code of parents) {
    let newcodeTrail = [...codeTrail];
    newcodeTrail.push(code);

    codeTreeArray.push({
      ...codeMap[code],
      code: code,
      codeTrail: codeTrail,
      level: codeTrail.length,
      color: codeMap[code].color
        ? codeMap[code].color
        : randomColor({ seed: code, luminosity: "light" }),
    });

    if (codeMap[code].children) {
      fillCodeTreeArray(codeMap, codeMap[code].children, codeTreeArray, newcodeTrail, showColors);
    }
  }
};

const parentData = (codeMap, code) => {
  // get array of parents from highest to lowers (tree)
  // look at parents to see if one is not active (activeParent).
  //    (this only matters if the same parent is folded, otherwise only the parent code itself is inactive)
  // look if there are folded parents, and if so pick the highest (foldToParent)
  const parents = [];
  let activeParent = true;
  let foldToParent = "";

  let parent = codeMap[code].parent;
  while (parent) {
    parents.push(parent);
    if (codeMap[parent].folded != null && codeMap[parent].folded) {
      foldToParent = parent; // this ends up being the highest level folded parent

      // code is inactive if only one of the folded parents is inactive
      if (codeMap[parent].active != null && !codeMap[parent].active) activeParent = false;
    }
    parent = codeMap[parent].parent;
  }
  return [parents.reverse(), activeParent, foldToParent];
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
