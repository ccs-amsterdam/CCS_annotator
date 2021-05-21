const codelistToTree = (codes) => {
  let parents = codes.reduce((roots, code) => {
    if (code.parent === "") roots[code.code] = { children: {} };
    return roots;
  }, {});

  let parentsDict = codes.reduce((dict, code) => {
    dict[code.code] = code.parent;
    return dict;
  }, {});

  return fillTree(parents, parentsDict);
};

const fillTree = (parents, parentsDict) => {
  const keys = Object.keys(parents);
  if (keys.length === 0) return null;

  for (const code of Object.keys(parentsDict)) {
    if (parents[parentsDict[code]]) {
      parents[parentsDict[code]].children[code] = {};
      delete parentsDict[code];
    }
  }

  for (const key of keys) parents[key] = fillTree(parents[key], parentsDict);
  return parents;
};

export default codelistToTree;
