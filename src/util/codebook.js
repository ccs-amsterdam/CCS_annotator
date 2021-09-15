import randomColor from "randomcolor";

export const codeBookEdgesToMap = (codes) => {
  const sortFun = (a, b) => {
    if (a.order && b.order && a.order !== b.order) return a.order - b.order;

    let labelA = a.code.toUpperCase(); // ignore upper and lowercase
    let labelB = b.code.toUpperCase(); // ignore upper and lowercase
    if (labelA < labelB) {
      return -1;
    }
    if (labelA > labelB) {
      return 1;
    }
    return 0;
  };

  // the payload is an array of objects, but for efficients operations
  // in the annotator we convert it to an object with the codes as keys
  const codeMap = codes.sort(sortFun).reduce((result, code) => {
    result[code.code] = { ...code, children: [], totalChildren: 0, totalActiveChildren: 0 };
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
    if (!codeMap[code].color)
      codeMap[code].color = randomColor({ seed: code, luminosity: "light" });

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

const parentData = (codes, code) => {
  // get array of parents from highest to lowers (tree)
  // look at parents to see if one is not active (activeParent).
  //    (this only matters if the same parent is folded, otherwise only the parent code itself is inactive)
  // look if there are folded parents, and if so pick the highest (foldToParent)
  const parents = [];
  let activeParent = true;
  let foldToParent = "";

  let parent = codes[code].parent;
  while (parent) {
    parents.push(parent);
    if (codes[parent].folded != null && codes[parent].folded) {
      foldToParent = parent; // this ends up being the highest level folded parent

      // code is inactive if only one of the folded parents is inactive
      if (codes[parent].active != null && !codes[parent].active) activeParent = false;
    }
    parent = codes[parent].parent;
  }
  return [parents.reverse(), activeParent, foldToParent];
};
