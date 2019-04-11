import { pathExists } from "fs-extra";
import refParser from "json-schema-ref-parser";
import getValidationErrors from "./get-validation-errors";
import { types } from "@open-rpc/meta-schema";
import isUrl = require("is-url");
import { fetchUrlSchemaFile, readSchemaFromFile } from "./get-open-rpc-document";

const cwd = process.cwd();

const isJson = (jsonString: string) => {
  try { JSON.parse(jsonString); return true; } catch (e) { return false; }
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
 * @example
 * ```typescript
 *
 * const { types } from "@open-rpc/meta-schema";
 * try {
 *   const fromUrl = await parse("example.com/openrpc.json") as types.OpenRPC;
 *   const fromFile = await parse("example.com/openrpc.json") as types.OpenRPC;
 *   const fromString = await parse('{ "openrpc": "1.0.0", ... }') as types.OpenRPC;
 *   const fromCwd = await parse() as types.OpenRPC; // default
 * } catch (e) {
 *   // handle validation errors
 * }
 * ```
 *
 */
export default async function parse(schema: string | types.OpenRPC = "./openrpc.json"): Promise<types.OpenRPC> {
  let parsedSchema: types.OpenRPC;

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
    const openrpcDocument = await refParser.dereference(parsedSchema) as types.OpenRPC;
    return openrpcDocument;
  } catch (e) {
    throw new Error(`The json schema provided cannot be dereferenced. Received Error: \n ${e.message}`);
  }
}
