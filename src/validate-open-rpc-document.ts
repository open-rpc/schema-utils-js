import metaSchema, { types } from "@open-rpc/meta-schema";
import JsonSchemaDraft07 from "../lib/json-schema-draft-07.json";
import Ajv from "ajv";

const ajv = new Ajv();
ajv.addMetaSchema(JsonSchemaDraft07, "https://json-schema.org/draft-07/schema#");

/**
 * Returns any JSON Schema validation errors that are found with the OpenRPC document passed in.
 *
 * @param document OpenRPC Document to validate
 *
 * @example
 * ```typescript
 *
 * const { types } from "@open-rpc/meta-schema"
 * const { validateOpenRPCDocument } from "@open-rpc/schema-utils-js";
 * const badOpenRPCDocument = {};
 * const errors = validateOpenRPCDocument({});
 * if (errors) {
 *   // handle errors
 * }
 * ```
 *
 */
export default function validateOpenRPCDocument(document: types.OpenRPC): Ajv.ErrorObject[] | null | undefined {
  const result = ajv.validate(metaSchema, document);

  return ajv.errors;
}
