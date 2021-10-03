import { useState, useEffect } from "react";

import db from "apis/dexie";
import { selectTokens } from "util/selectTokens";
import { prepareDocumentBatch } from "util/createDocuments";

const defaultSettings = {
  // These are not part of the codebook, because they depend on the type of task
  // (so they results from certain codebook settings, but the user doesn't need to see this)
  height: 75,
  textUnitPosition: 1 / 4,
  showAnnotations: false,
  canAnnotate: true,
};

/**
 * Custom hook for async composing of the itemBundle
 *
 * @param {*} item
 * @param {*} codebook
 * @param {*} settings
 */
const useItemBundle = (item, codebook, settings = defaultSettings, preview) => {
  const [itemBundle, setItemBundle] = useState(null);

  useEffect(() => {
    if (!item) return null;
    //setItemBundle(null);
    prepareItemBundle(item, codebook, settings, preview, setItemBundle);
  }, [item, codebook, settings, setItemBundle, preview]);

  //if (!item || !itemBundle) return null;
  return itemBundle;
};

/**
 * Given an item and codebook, prepares a bundle to send to the annotator
 * The bundle contains everything the annotator needs, including codebook settings
 *
 * @param {*} item
 * @param {*} codebook
 * @param {*} settings
 * @param {*} setItemBundle
 * @returns
 */
const prepareItemBundle = async (item, codebook, settings, preview, setItemBundle) => {
  // Note that every item must exist as a document in the indexedDb, even if it's only opened once for annotation servers that pass
  // one item at a time. This ensures safe and smooth annotating (e.g., broken connection, refreshing page)
  // (NOTE TO SELF: Before <Document>, the codebook and item must therefore have been processed and stored)
  let itemBundle;
  if (item.doc_uid) itemBundle = await db.getDocument(item.doc_uid); // get document information (text/tokens, annotations)
  if (!itemBundle) itemBundle = prepareTempItem(item);
  if (!itemBundle) return;

  if (codebook.unitSettings) {
    // if full document is retrieved, use codingUnit and contextUnit to select the coding/context tokens
    const { contextUnit, contextWindow } = codebook.unitSettings;
    itemBundle.tokens = selectTokens(itemBundle.tokens, item, contextUnit, contextWindow);
    itemBundle.textUnitSpan = getUnitSpan(itemBundle);
  }

  itemBundle.item = item; // add item information
  itemBundle.writable = false; // this prevents overwriting annotations before they have been loaded (in <ManageAnnotations>)
  itemBundle.codebook = codebook;
  itemBundle.settings = settings;
  itemBundle.settings.saveAnnotations = !preview;
  if (itemBundle) setItemBundle(itemBundle);
};

/**
 * If an item does not exist in the indexedDB, prepare it on the fly
 * This does mean that annotations will also not be saved in the indexedDB,
 * so any results should immediately be send to a server via the 'returnAddress'
 *
 * The preparation is flexible, and allows the items to have several forms.
 * If the item does not yet have tokens, but it does have "text", it will be tokenized
 * @param {*} item
 * @param {*} codebook
 */
const prepareTempItem = (item, codebook) => {
  const text_fields = [];
  if (item.contextBefore)
    text_fields.push({ name: "text", textPart: "contextBefore", value: item.contextBefore });
  if (item.text) text_fields.push({ name: "text", textPart: "textUnit", value: item.text });
  if (item.contextAfter)
    text_fields.push({ name: "text", textPart: "contextAfter", value: item.contextAfter });

  const [documents] = prepareDocumentBatch([{ text_fields }]); // returns [documents, codes], so destructure it
  return documents[0];
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

export default useItemBundle;
