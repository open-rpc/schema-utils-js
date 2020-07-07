import Dereferencer from "@json-schema-tools/dereferencer";
import validateOpenRPCDocument, { OpenRPCDocumentValidationError } from "./validate-open-rpc-document";
import isUrl = require("is-url");
import { OpenrpcDocument as OpenRPC, ReferenceObject, ExamplePairingObject, JSONSchema, SchemaComponents, ContentDescriptorComponents, ContentDescriptorObject } from "@open-rpc/meta-schema";
import { TGetOpenRPCDocument } from "./get-open-rpc-document";
import Ptr, { EvalError, InvalidPtrError } from "@json-schema-spec/json-pointer"

/**
 * Provides an error interface for OpenRPC Document dereferencing problems
 *
 * @category Errors
 *
 */
export class OpenRPCDocumentDereferencingError implements Error {
  public name = "OpenRPCDocumentDereferencingError";
  public message: string;

  /**
   * @param e The error that originated from jsonSchemaRefParser
   */
  constructor(e: string) {
    this.message = `The json schema provided cannot be dereferenced. Received Error: \n ${e}`;
  }
}

const derefItem = (item: ReferenceObject, doc: OpenRPC) => {
  const { $ref } = item;
  if ($ref === undefined) { return item; }

  let pointer;
  try {
    pointer = Ptr.parse($ref);
  } catch (err) {
    if (err instanceof InvalidPtrError) {
      throw new OpenRPCDocumentDereferencingError(`Invalid JSON Pointer - ${$ref}`);
    }
    throw new OpenRPCDocumentDereferencingError(`unhandled error - ${err.message}`);
  }

  try {
    return pointer.eval(doc);
  } catch (err) {
    if (err instanceof EvalError) {
      throw new OpenRPCDocumentDereferencingError([
        `unable to eval pointer against OpenRPC Document.`,
        `instance: ${err.instance}`,
        `token: ${err.token}`,
        `pointer: ${$ref}`,
      ].join("\n"));
    }
  }
};

const makeDereferenceDocument = () => {
  /**
   * replaces $ref's within a document and its schemas. The replaced value will be a javascript object reference to the
   * real schema / open-rpc component
   *
   * @param schema The OpenRPC document
   *
   * @returns The same OpenRPC Document that was passed in, but with all $ref's dereferenced.
   *
   * @throws [[OpenRPCDocumentDereferencingError]]
   *
   * @example
   * ```typescript
   *
   * const { OpenRPC } from "@open-rpc/meta-schema"
   * const { dereferenceDocument } from "@open-rpc/schema-utils-js";
   *
   * try {
   *   const dereffedDocument = await dereferenceDocument({ ... }) as OpenRPC;
   * } catch (e) {
   *   // handle validation errors
   * }
   * ```
   *
   */
  return async function dereferenceDocument(openrpcDocument: OpenRPC): Promise<OpenRPC> {
    if (openrpcDocument.components !== undefined) {

      if (openrpcDocument.components.schemas !== undefined) {
        const schemas = openrpcDocument.components.schemas as SchemaComponents;
        const schemaKeys = Object.keys(schemas);

        schemaKeys.forEach(async (k) => {
          const superSchema = { ...schemas[k], components: openrpcDocument.components };
          const dereffer = new Dereferencer(superSchema);
          const dereffed = await dereffer.resolve();
          delete dereffed.components;
          schemas[k] = dereffed;
        });
      }

      if (openrpcDocument.components.contentDescriptors !== undefined) {
        const contentDescriptors = openrpcDocument.components.contentDescriptors as ContentDescriptorComponents;
        const cdKeys = Object.keys(contentDescriptors);

        cdKeys.forEach(async (k) => {
          const cdSchema = contentDescriptors[k].schema;
          const superSchema = { ...cdSchema, components: openrpcDocument.components };
          const dereffer = new Dereferencer(superSchema);
          const dereffed = await dereffer.resolve();
          delete dereffed.components;
          contentDescriptors[k].schema = dereffed;
        });
      }
    }

    openrpcDocument.methods = await Promise.all(openrpcDocument.methods.map(async (method) => {
      if (method.tags !== undefined) {
        method.tags = method.tags.map((t) => derefItem(t as ReferenceObject, openrpcDocument));
      }

      if (method.errors !== undefined) {
        method.errors = method.errors.map((e) => derefItem(e as ReferenceObject, openrpcDocument));
      }

      if (method.links !== undefined) {
        method.links = method.links.map((e) => derefItem(e as ReferenceObject, openrpcDocument));
      }

      if (method.examples !== undefined) {
        method.examples = method.examples.map((ex) => derefItem(ex as ReferenceObject, openrpcDocument));
        method.examples.map((ex) => {
          const exAsPairing = ex as ExamplePairingObject;
          exAsPairing.params = exAsPairing.params.map((exParam) => derefItem(exParam as ReferenceObject, openrpcDocument));
          exAsPairing.result = derefItem(exAsPairing.result as ReferenceObject, openrpcDocument);
          return exAsPairing;
        });
      }

      method.params = method.params.map((p) => derefItem(p as ReferenceObject, openrpcDocument));
      method.result = derefItem((method.result as ReferenceObject), openrpcDocument);

      const params = method.params as ContentDescriptorObject[];
      params.forEach(async (p) => {
        const superSchema = { ...p.schema, components: openrpcDocument.components };
        const dereffer = new Dereferencer(superSchema);
        const dereffed = await dereffer.resolve();
        delete dereffed.components;
        p.schema = dereffed;
      });

      const result = method.result as ContentDescriptorObject;

      const superSchema = { ...result.schema, components: openrpcDocument.components };
      const dereffer = new Dereferencer(superSchema);
      const dereffed = await dereffer.resolve();
      delete dereffed.components;

      result.schema = dereffed;

      return method;
    }));


    return openrpcDocument;
  };
};

export default makeDereferenceDocument;
