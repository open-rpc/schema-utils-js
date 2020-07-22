import makeDereferenceDocument from "./dereference-document";
import validateOpenRPCDocument, { OpenRPCDocumentValidationError } from "./validate-open-rpc-document";
import isUrl = require("is-url");
import { OpenrpcDocument } from "@open-rpc/meta-schema";
import { TGetOpenRPCDocument } from "./get-open-rpc-document";

/**
 * @ignore
 */
const isJson = (jsonString: string): boolean => {
  try { JSON.parse(jsonString); return true; } catch (e) { return false; }
};

/**
 * Options that may be passed to parseOpenRPCDocument.
 *
 * @category Options
 *
 */
export interface ParseOpenRPCDocumentOptions {
  /*
   * Enable or disable Schema validation of the [[OpenRPC]] document against the OpenRPC meta-schema.
   *
   * @default true
   *
   */
  validate?: boolean;

  /*
   * Enable or disable the referencing of content descriptors and schemas. This will replace `$ref` keys.
   *
   * @default true
   *
   */
  dereference?: boolean;
}

const defaultParseOpenRPCDocumentOptions = {
  dereference: true,
  validate: true,
};

const makeParseOpenRPCDocument = (fetchUrlSchema: TGetOpenRPCDocument, readSchemaFromFile: TGetOpenRPCDocument) => {
  const derefenceDocument = makeDereferenceDocument();

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
   * @param options Parser options. See [[IParseOpenRPCDocumentOptions]]
   *
   * @returns The same OpenRPC Document that was passed in, but with all $ref's dereferenced.
   *
   * @throws [[OpenRPCDocumentValidationError]]
   * @throws [[OpenRPCDocumentDereferencingError]]
   *
   * @example
   * ```typescript
   *
   * const { OpenRPC } from "@open-rpc/meta-schema"
   * const { parseOpenRPCDocument } from "@open-rpc/schema-utils-js";
   *
   * try {
   *   const fromUrl = await parseOpenRPCDocument("example.com/openrpc.json") as OpenRPC;
   *   const fromFile = await parseOpenRPCDocument("example.com/openrpc.json") as OpenRPC;
   *   const fromString = await parseOpenRPCDocument('{ "openrpc": "1.0.0", ... }') as OpenRPC;
   *   const fromCwd = await parseOpenRPCDocument() as types.OpenRPC; // default
   * } catch (e) {
   *   // handle validation errors
   * }
   * ```
   *
   */
  return async function parseOpenRPCDocument(
    schema: string | OpenrpcDocument = "./openrpc.json",
    options: ParseOpenRPCDocumentOptions = defaultParseOpenRPCDocumentOptions,
  ): Promise<OpenrpcDocument> {
    let parsedSchema: OpenrpcDocument;

    const parseOptions = { ...defaultParseOpenRPCDocumentOptions, ...options } as ParseOpenRPCDocumentOptions;

    if (typeof schema !== "string") {
      parsedSchema = schema;
    } else if (isJson(schema as string)) {
      parsedSchema = JSON.parse(schema as string);
    } else if (isUrl(schema as string)) {
      parsedSchema = await fetchUrlSchema(schema as string);
    } else {
      parsedSchema = await readSchemaFromFile(schema as string);
    }

    if (parseOptions.validate) {
      const isValid = validateOpenRPCDocument(parsedSchema);
      if (isValid instanceof OpenRPCDocumentValidationError) {
        throw isValid;
      }
    }

    let postDeref: OpenrpcDocument = parsedSchema;
    if (parseOptions.dereference) {
      postDeref = await derefenceDocument(parsedSchema);
    }

    if (parseOptions.validate) {
      const isValid = validateOpenRPCDocument(postDeref);
      if (isValid instanceof OpenRPCDocumentValidationError) {
        throw isValid;
      }
    }

    return postDeref;
  };
};

export default makeParseOpenRPCDocument;
