import nlp from "compromise";
import paragraphs from "compromise-paragraphs";
nlp.extend(paragraphs);

export const parseTokens = (texts) => {
  // map to single array.
  // for some reason there's an extra array layer between sents and pars...
  // I've only found cases where lenght is 1, but I'll map it just in case
  const tokens = [];
  let token = null;
  let paragraph = 0;
  let sentence = 0;
  let tokenIndex = 0;
  let t = null;
  let text = null;
  for (let section of Object.keys(texts)) {
    text = texts[section];
    t = nlp.tokenize(text).paragraphs().json({ offset: true });
    for (let par = 0; par < t.length; par++) {
      for (let sent = 0; sent < t[par].sentences.length; sent++) {
        for (let sent2 = 0; sent2 < t[par].sentences[sent].length; sent2++) {
          for (let term = 0; term < t[par].sentences[sent][sent2].terms.length; term++) {
            token = t[par].sentences[sent][sent2].terms[term];
            tokens.push({
              section: section,
              offset: token.offset.start,
              length: token.offset.length,
              paragraph: paragraph,
              sentence: sentence,
              index: tokenIndex,
              text: token.text,
              pre: token.pre,
              post: token.post,
            });
            tokenIndex++;
          }
        }
        sentence++;
      }
      paragraph++;
    }
  }
  return tokens;
};

export const safeTokens = (tokens) => {
  //const indexFrom1 = tokens[0].offset && tokens[0].offset === 1;
  let paragraph = 0;

  const requiredFields = ["sentence", "text", "offset", "length"];
  for (let rf of requiredFields) {
    if (!tokens[0].text) tokens[0].text = tokens[0].token;
    if (tokens[0][rf] == null) {
      alert(`Invalid token data:\n\nimported tokens must have ${rf} field`);
      return null;
    }
  }

  for (let i = 0; i < tokens.length; i++) {
    if (!tokens[i].text) tokens[i].text = tokens[i].token;
    if (!tokens[i].pre) tokens[i].pre = "";

    if (!tokens[i].post)
      tokens[i].post =
        i < tokens.length - 1
          ? " ".repeat(Math.max(0, tokens[i + 1].offset - tokens[i].offset - tokens[i].length))
          : " ";
    if (!tokens[i].paragraph) tokens[i].paragraph = paragraph;
    if (tokens[i].text.includes("\n") || tokens[i].post.includes("\n")) paragraph++;
    if (!tokens[i].section) tokens[i].section = "text";
    tokens[i].index = i;
  }

  return tokens;
};
