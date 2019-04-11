import { readJson, pathExists } from "fs-extra";
import isUrl = require("is-url");
import refParser from "json-schema-ref-parser";
import fetch from "node-fetch";
import { getValidationErrors } from "./get-validation-errors";
import { types } from "@open-rpc/meta-schema";

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

export async function parse(schema?: string | types.OpenRPC): Promise<types.OpenRPC> {
  let parsedSchema: types.OpenRPC;

  if (schema === undefined) {
    schema = `${cwd}/openrpc.json`;
  }

  if (typeof schema !== "string") {
    parsedSchema = schema;
  } else if (isJson(schema as string)) {
    parsedSchema = JSON.parse(schema as string);
  } else if (isUrl(schema as string)) {
    parsedSchema = await fetchUrlSchemaFile(schema as string);
  } else {
    const isCorrectPath = await pathExists(schema as string);
    parsedSchema = await readSchemaFromFile(schema as string);
  }

  const errors = getValidationErrors(parsedSchema);
  if (errors) {
    throw new Error(`Error Validating schema against meta-schema. \n ${JSON.stringify(errors, undefined, "  ")}`);
  }

  try {
    return await refParser.dereference(parsedSchema) as types.OpenRPC;
  } catch (e) {
    throw new Error(`The json schema provided cannot be dereferenced. Received Error: \n ${e.message}`);
  }
}
