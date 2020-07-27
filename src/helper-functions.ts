import { OpenrpcDocument as OpenRPC } from "@open-rpc/meta-schema";

/** 
 * finds array index of array object which matches predicate
 * @param array {any[]}
 * @param predicate {Function}
 * @returns {number} || {undefined}
*/
export const findIndex = (array: any[], predicate: Function) => {
  const length = array == null ? 0 : array.length;
  if (!length) {
    return -1;
  }
  let index = -1;
  while (++index < length) {
    if (predicate(array[index])) {
      return index;
    }
  }
  return -1;
};

/** 
 * finds an array elements which matches the predicate
 * @param array {any[]}
 * @param predicate {Function}
 * @returns {any} || {undefined}
*/
export const find = (array: any[], predicate: Function) => {
  const length = array == null ? 0 : array.length;
  if(!length) {
    return undefined;
  }
  let index = -1;
  while (++index < length) {
    if (predicate(array[index])) {
      return array[index];
    }
  }
  return undefined;
};

/** 
 * compares OpenrpcDocuments
 * 
 * @param doc1 {OpenrpcDocument}
 * @param doc2 {OpenrpcDocument}
 * @returns {boolean}
*/
export const rpcDocIsEqual = (doc1: OpenRPC, doc2: OpenRPC) => {
  const doc1Keys = Object.keys(doc1);
  const doc2Keys = Object.keys(doc2);
  const doc1Len = doc1Keys.length;
  const doc2Len = doc2Keys.length;

  if(doc1Len != doc2Len) {
    return false;
  }

  let key: string;
  let index = doc1Len;
  while (index--) {
    key = doc1Keys[index];
    if (!(key in doc2)) {
      return false;
    }
    // @ts-ignore
    else if (typeof doc1[key] === 'object' && typeof doc2[key] === 'object') { 
      // @ts-ignore
      if (!rpcDocIsEqual(doc1[key], doc2[key])) {
        return false;
      }
    }
    // @ts-ignore
    else if (doc1[key] != doc2[key]) {
      return false;
    }
  }
  return true;
};