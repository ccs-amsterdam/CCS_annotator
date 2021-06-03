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

export const importTokens = (tokens) => {
  //const indexFrom1 = tokens[0].offset && tokens[0].offset === 1;
  let paragraph = 0;

  let offset = 0;
  let totalLength = 0;
  for (let i = 0; i < tokens.length; i++) {
    if (!tokens[i].text) {
      if (tokens[i].token) {
        tokens[i].text = tokens[i].token;
      } else {
        alert("Invalid token data:\n\nimported tokens must have 'text' or 'token' field");
        return null;
      }
    }
    if (!tokens[i].offset && tokens[i].start) tokens[i].offset = tokens[i].start;
    if (!tokens[i].length) tokens[i].length = tokens[i].text.length;

    if (!tokens[i].pre) tokens[i].pre = "";
    if (!tokens[i].post && tokens[i].space) tokens[i].post = tokens[i].space;
    if (!tokens[i].post && tokens[i].offset && tokens[i].length) {
      tokens[i].post =
        i < tokens[i].length - 1
          ? " ".repeat(Math.max(0, tokens[i + 1].offset - tokens[i].offset - tokens[i].length))
          : "";
    } else {
      tokens[i].post = " ";
    }

    totalLength = tokens[i].length + tokens[i].pre.length + tokens[i].post.length;

    if (!tokens[i].offset) {
      tokens[i].offset = offset;
      offset = offset + totalLength;
    }

    if (i < tokens.length - 1 && tokens[i + 1].offset < tokens[i].offset + totalLength) {
      alert(
        `Invalid token position data. The length of ${
          tokens[i].pre + tokens[i].text + tokens[i].post
        } exeeds the offset/start position of the next token`
      );
      return null;
    }

    if (!tokens[i].paragraph) tokens[i].paragraph = paragraph;
    if (tokens[i].text.includes("\n") || tokens[i].post.includes("\n")) paragraph++;
    if (!tokens[i].section) tokens[i].section = "text";
    tokens[i].index = i;
  }

  return tokens;
};
