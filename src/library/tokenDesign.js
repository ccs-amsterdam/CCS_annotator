export const getColor = (annotationCode, codeMap) => {
  if (codeMap[annotationCode]) {
    const foldTo = codeMap[annotationCode].foldToParent;
    if (foldTo && codeMap[foldTo]) return codeMap[foldTo].color + "50";
    return codeMap[annotationCode].color + "50";
  } else {
    return "#ffffff50";
  }
};

export const getColorGradient = (colors) => {
  let color = null;

  if (colors.length === 1) {
    color = colors[0];
  } else {
    const pct = Math.floor(100 / colors.length);
    const gradColors = colors.reduce((a, color, i) => {
      if (i === 0) a.push(color + ` ${pct}%`);
      if (i === colors.length - 1) a.push(color + ` ${100 - pct}%`);

      if (i > 0 && i < colors.length - 1) {
        a.push(color + ` ${pct * i}%`);
        a.push(color + ` ${pct * (i + 1)}%`);
      }
      return a;
    }, []);

    color = `linear-gradient(to bottom, ${gradColors.join(", ")})`;
  }

  return color;
};

export const getColorGradient2 = (colors) => {
  //console.log(colors);
  // colors is an array of colors, but can also have nested arrays
  // colorgradient will show a rainbow of all colors in order, with a sub-rainbow for nested arrays

  if (colors.length === 1) {
    if (typeof colors[0] === "object") {
      if (colors[0].length === 1) return colors[0][0];
    } else return colors[0];
  }

  const pct = Math.floor(100 / colors.length);
  const gradient = [];
  for (let i = 0; i < colors.length; i++) {
    let subcolors = colors[i];
    if (typeof subcolors !== "object") subcolors = [subcolors];

    for (let j = 0; j < subcolors.length; j++) {
      let subcolor = subcolors[j];
      const subpct = Math.floor(pct / subcolors.length);

      // first color
      if (i === 0 && j === 0) gradient.push(subcolor + ` ${subpct}%`);

      // middle color
      if (i > 0 && i < colors.length - 1 && j < subcolors.length - 1) {
        gradient.push(subcolor + ` ${i * pct + j * subpct}%`);
        gradient.push(subcolor + ` ${i * pct + (j + 1) * subpct}%`);
      }

      // last color
      if (i === colors.length - 1 && j === subcolors.length - 1)
        gradient.push(subcolor + ` ${100 - subpct}%`);
    }
  }

  return `linear-gradient(to bottom, ${gradient.join(", ")})`;
};
