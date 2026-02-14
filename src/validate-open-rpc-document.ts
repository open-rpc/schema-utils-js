import { OpenrpcDocument as OpenRPC } from "./types";
import Ajv, { ErrorObject } from "ajv";
import JsonSchemaMetaSchema from "@json-schema-tools/meta-schema";
import applyExtensionSpec from "./apply-extension-spec";
import getExtendedMetaSchema from "./get-extended-metaschema";

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
  if (!document) throw new Error("schema-utils-js: Internal Error - document is undefined");

  const ajv = new Ajv();
  ajv.addSchema(JsonSchemaMetaSchema, "https://meta.json-schema.tools");
  let extMetaSchema = getExtendedMetaSchema(document.openrpc);
  try {
    extMetaSchema = applyExtensionSpec(document, extMetaSchema);
    ajv.validate(extMetaSchema, document);
  } catch (e) {
    throw new Error(
      [
        "schema-utils-js: Internal Error",
        "-----",
        e,
        "-----",
        "If you see this report it: https://github.com/open-rpc/schema-utils-js/issues",
      ].join("\n")
    );
  }

  if (ajv.errors) {
    return new OpenRPCDocumentValidationError(ajv.errors as ErrorObject[]);
  } else {
    return true;
  }
}
