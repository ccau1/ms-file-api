type LocalizeObject = { [key: string]: any };

const localizeObject = (docs: any, locale: string) => {
  if (!locale || !docs) return docs;

  const thisDoc = docs?.toJSON ? docs.toJSON() : docs;

  if (Array.isArray(thisDoc)) {
    return thisDoc.map(d => localizeObject(d, locale));
  } else if (typeof thisDoc === 'object') {
    // it is an object
    // if this object has key locale, return that
    if (thisDoc[locale]) {
      return thisDoc[locale];
    } else {
      // else go through each key in the object and render it recursively
      return Object.keys(thisDoc).reduce<LocalizeObject>((obj, docKey) => {
        obj[docKey] = localizeObject(thisDoc[docKey], locale);
        return obj;
      }, {});
    }
  } else {
    // it is just a regular field, so check just return it
    return thisDoc;
  }
};

export default localizeObject;
