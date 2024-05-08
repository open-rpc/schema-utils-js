import metaSchema, { OpenrpcDocument as OpenRPC } from "@open-rpc/meta-schema";
import Ajv, { ErrorObject } from "ajv";
import JsonSchemaMetaSchema from "@json-schema-tools/meta-schema/";

/**
 * @ignore
 */
/**
 * Provides an error interface for OpenRPC Document validation
 *
 * @category Errors
 *
 */
export class OpenRPCDocumentValidationError implements Error {
  public name = "OpenRPCDocumentDereferencingError";
  public message: string;
  /**
   * @param errors The errors received by ajv.errors.
   */
  constructor(errors: ErrorObject[]) {
    this.message = [
      "Error validating OpenRPC Document against @open-rpc/meta-schema.",
      "The errors found are as follows:",
      JSON.stringify(errors, undefined, "  "),
    ].join("\n");
  }
}

/**
 * Returns any JSON Schema validation errors that are found with the OpenRPC document passed in.
 *
 * @param document OpenRPC Document to validate.
 *
 * @returns Either true if everything checks out, or a well formatted error.
 *
 * @example
 * ```typescript
 *
 * import { validateOpenRPCDocument } from "@open-rpc/schema-utils-js";
 * const badOpenRPCDocument = {} as any;
 *
 * const result = validateOpenRPCDocument(badOpenRPCDocument);
 * if (result !== true) {
 *   console.error(result);
 * }
 * ```
 *
 */
export default function validateOpenRPCDocument(
  document: OpenRPC
): OpenRPCDocumentValidationError | true {
  const ajv = new Ajv();
  ajv.addSchema(JsonSchemaMetaSchema, "https://meta.json-schema.tools");
  const metaSchemaCopy = { ...metaSchema } as any;
  delete metaSchemaCopy.definitions.JSONSchema.$id;
  delete metaSchemaCopy.definitions.JSONSchema.$schema;
  delete metaSchemaCopy.$schema;
  delete metaSchemaCopy.$id;
  try {
    ajv.validate(metaSchemaCopy, document);
  } catch (e) {
    return new OpenRPCDocumentValidationError([
      {
        message: (e as unknown as Error).message,
        dataPath: "unknown",
        schemaPath: "unknown",
        params: {},
        keyword: "unknown",
        data: JSON.parse(JSON.stringify(e)),
      },
    ]);
  }

  if (ajv.errors) {
    return new OpenRPCDocumentValidationError(ajv.errors as ErrorObject[]);
  } else {
    return true;
  }
}
