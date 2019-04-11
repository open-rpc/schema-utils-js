import { readJson } from "fs-extra";
import isUrl = require("is-url");
import refParser from "json-schema-ref-parser";
import fetch from "node-fetch";
import { getValidationErrors } from "./get-validation-errors";

const cwd = process.cwd();

const isJson = (jsonString: string) => {
  try { JSON.parse(jsonString); return true; } catch (e) { return false; }
};

const fetchUrlSchemaFile = async (schema: string) => {
  try {
    const response = await fetch(schema);
    return await response.json();
  } catch (e) {
    throw new Error(`Unable to download openrpc.json file located at the url: ${schema}`);
  }
};

const readSchemaFromFile = async (schema: string) => {
  try {
    return await readJson(schema);
  } catch (e) {
    if (e.message.includes("SyntaxError")) {
      throw new Error(`Failed to parse json in file ${schema}`);
    } else {
      throw new Error(`Unable to read openrpc.json file located at ${schema}`);
    }
  }
};

/**
 * Resolves an OpenRPC document from a variety of input types. The resolved OpenRPC document
 * will be dereferenced and validated against the [meta-schema](https://github.com/open-rpc/meta-schema).
 *
 * @param schema The OpenRPC document or a reference to one.
 *
 * If schema is an object, it will use this as the openrpc document literally.
 * If schema is a string, it may fall under 3 other categories:
 *   1. schema is an OpenRPC document as a json string.
 *   2. schema is a url that resolves to an OpenRPC document.
 *   3. schema is a file path, where the file at the path contains an OpenRPC document.
 *
 */
export async function parse(schema = "./openrpc.json") {
  let parsedSchema;

  if (isJson(schema)) {
    parsedSchema = JSON.parse(schema);
  } else if (isUrl(schema)) {
    parsedSchema = await fetchUrlSchemaFile(schema);
  } else {
    parsedSchema = await readSchemaFromFile(schema);
  }

  const errors = getValidationErrors(parsedSchema);
  if (errors) {
    throw new Error(`Error Validating schema against meta-schema. \n ${JSON.stringify(errors, undefined, "  ")}`);
  }

  try {
    return await refParser.dereference(parsedSchema);
  } catch (e) {
    throw new Error(`The json schema provided cannot be dereferenced. Received Error: \n ${e.message}`);
  }
}
