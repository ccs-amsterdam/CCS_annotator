import React, { useState, useEffect } from "react";

import db from "apis/dexie";
import ManageAnnotations from "./ManageAnnotations";
import { codeBookEdgesToMap } from "util/codebook";
import Tokens from "./Tokens";
import { selectTokens } from "util/selectTokens";
import AnnotateNavigation from "./AnnotateNavigation";

const defaultSettings = {
  height: 75,
  textUnitPosition: 1 / 4,
  showAnnotations: false,
  canAnnotate: true,
  saveAnnotations: true,
};

const Document = ({ item, codebook, settings = defaultSettings }) => {
  const [itemBundle, setItemBundle] = useState(null);
  useEffect(() => {
    if (!item) return null;
    setItemBundle(null);
    prepareItemBundle(item, codebook, setItemBundle);
  }, [item, codebook, setItemBundle]);

  if (!item || !itemBundle) return null;
  return (
    <>
      <Tokens taskItem={itemBundle} settings={settings} />
      <ManageAnnotations taskItem={itemBundle} saveAnnotations={settings.saveAnnotations} />
      {settings.canAnnotate ? <AnnotateNavigation tokens={itemBundle.tokens} /> : null}
    </>
  );

  return <div></div>;
};

/**
 * Given an item and codebook, prepares a bundle to send to the annotator
 * The bundle contains everything the annotator needs, including codebook settings
 *
 * @param {*} item
 * @param {*} itemSettings
 * @param {*} setItemBundle
 * @param {*} codeMap
 * @returns
 */
const prepareItemBundle = async (item, codebook, setItemBundle) => {
  // if codeMap is not yet made, first add it to the codebook object
  // (this way it only needs to be made if codebook changes)
  if (!codebook.codeMap) codebook.codeMap = codeBookEdgesToMap(codebook.codes || []);

  // Note that every item must exist as a document in the indexedDb, even if it's only opened once for annotation servers that pass
  // one item at a time. This ensures safe and smooth annotating (e.g., broken connection, refreshing page)
  // (NOTE TO SELF: Before <Document>, the codebook and item must therefore have been processed and stored)
  let itemBundle = await db.getDocument(item.doc_uid); // get document information (text/tokens, annotations)
  if (!itemBundle) return;

  itemBundle.item = item; // add item information
  itemBundle.writable = false; // this prevents overwriting annotations before they have been loaded (in <ManageAnnotations>)

  // Mark tokens as coding / context unit, and remove unused tokens.
  const { contextUnit, contextWindow } = codebook.unitSettings;
  itemBundle.tokens = selectTokens(itemBundle.tokens, item, contextUnit, contextWindow);

  itemBundle.textUnitSpan = getUnitSpan(itemBundle);

  itemBundle.codebook = codebook;
  if (itemBundle) setItemBundle(itemBundle);
};

/**
 * Gets the char span for the coding unit.
 * Needed for tokenization agnostic storing of annotations
 */
const getUnitSpan = (itemBundle) => {
  const firstUnitToken = itemBundle.tokens.find((token) => token.textPart === "textUnit");
  let lastUnitToken = itemBundle.tokens.find((token) => token.textPart === "contextAfter");
  if (lastUnitToken == null) lastUnitToken = itemBundle.tokens[itemBundle.tokens.length - 1];
  return [firstUnitToken.offset, lastUnitToken.offset + lastUnitToken.length];
};

export default React.memo(Document);
