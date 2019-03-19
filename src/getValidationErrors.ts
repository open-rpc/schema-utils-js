import metaSchema, { types } from "@open-rpc/meta-schema";
import JsonSchemaDraft07 from "../lib/json-schema-draft-07.json";
import Ajv from "ajv";

const ajv = new Ajv();
ajv.addMetaSchema(JsonSchemaDraft07, "https://json-schema.org/draft-07/schema#");

export const getValidationErrors = (schema: types.OpenRPC): Ajv.ErrorObject[] | null | undefined => {
  const result = ajv.validate(metaSchema, schema);

  return ajv.errors;
};
