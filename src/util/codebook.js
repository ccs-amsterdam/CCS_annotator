import randomColor from "randomcolor";

/**
 * Transform the taskSettings into the codebook. The difference is that taskSettings also contains information that's only relevant in the manager. The codebook contains only the information relevant for the annotator
 * @param {*} taskSettings
 */
export const getCodebook = taskSettings => {
  const codebook = {
    type: taskSettings.type,
    ...taskSettings[taskSettings.type],
  };

  return codebook;
};

export const standardizeCodes = codes => {
  return codes.map((code, i) => {
    if (typeof code !== "object") code = { code };
    if (code.active == null) code.active = true;
    if (code.tree == null) code.tree = [];
    if (code.parent == null) code.parent = "";
    if (code.color == null) code.color = randomColor({ seed: code.code, luminosity: "light" });
    return code;
  });
};

export const codeBookEdgesToMap = codes => {
  // const sortFun = (a, b) => {
  //   if (a.order && b.order && a.order !== b.order) return a.order - b.order;

  //   let labelA = a.code.toUpperCase(); // ignore upper and lowercase
  //   let labelB = b.code.toUpperCase(); // ignore upper and lowercase
  //   if (labelA < labelB) {
  //     return -1;
  //   }
  //   if (labelA > labelB) {
  //     return 1;
  //   }
  //   return 0;
  // };

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
    code => !codeMap[code].parent || codeMap[code].parent === ""
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
