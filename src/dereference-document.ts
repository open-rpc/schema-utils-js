import Dereferencer from "@json-schema-tools/dereferencer";
import { OpenrpcDocument as OpenRPC, ReferenceObject, ExamplePairingObject, JSONSchema, SchemaComponents, ContentDescriptorComponents, ContentDescriptorObject, OpenrpcDocument, MethodObject } from "@open-rpc/meta-schema";
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

  const ref = $ref.replace("#", "");
  let pointer;
  try {
    pointer = Ptr.parse(ref);
  } catch (err) {
    if (err instanceof InvalidPtrError) {
      throw new OpenRPCDocumentDereferencingError([`Invalid JSON Pointer - ${$ref}`, `The doc: ${JSON.stringify(doc)}`].join("\n"));
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
    throw new OpenRPCDocumentDereferencingError(`Unable to eval pointer against OpenRPC Document: ${err.message}`);
  }
};

const handleSchemaWithSchemaComponents = async (s: JSONSchema, schemaComponents: SchemaComponents) => {
  if (s === true || s === false) {
    return Promise.resolve(s);
  }

  if (schemaComponents !== undefined) {
    s.components = { schemas: schemaComponents }
  }

  const dereffer = new Dereferencer(s);

  try {
    const dereffed = await dereffer.resolve();
    if (dereffed !== true && dereffed !== false) {
      delete dereffed.components;
    }
    return dereffed;
  } catch (e) {
    throw new OpenRPCDocumentDereferencingError([
      "Unable to parse reference inside of JSONSchema",
      s.title ? `Schema Title: ${s.title}` : "",
      `error message: ${e.message}`
    ].join("\n"));
  }
};

const handleSchemaComponents = async (doc: OpenrpcDocument): Promise<OpenrpcDocument> => {
  if (doc.components === undefined) {
    return Promise.resolve(doc);
  }
  if (doc.components.schemas === undefined) {
    return Promise.resolve(doc);
  }

  const schemas = doc.components.schemas as SchemaComponents;
  const schemaKeys = Object.keys(schemas);

  schemaKeys.forEach(async (k) => {
    schemas[k] = await handleSchemaWithSchemaComponents(schemas[k], schemas);
  });

  return doc;
};

const handleSchemasInsideContentDescriptorComponents = async (doc: OpenrpcDocument): Promise<OpenrpcDocument> => {
  if (doc.components === undefined) {
    return Promise.resolve(doc);
  }
  if (doc.components.contentDescriptors === undefined) {
    return Promise.resolve(doc);
  }

  const cds = doc.components.contentDescriptors as ContentDescriptorComponents;
  const cdsKeys = Object.keys(cds);

  let componentSchemas: SchemaComponents;
  if (doc.components.schemas) {
    componentSchemas = doc.components.schemas as SchemaComponents;
  }

  cdsKeys.forEach(async (k) => {
    cds[k].schema = await handleSchemaWithSchemaComponents(cds[k].schema, componentSchemas);
  });

  return doc;
};


const handleMethod = async (method: MethodObject, doc: OpenrpcDocument): Promise<MethodObject> => {
  if (method.tags !== undefined) {
    method.tags = method.tags.map((t) => derefItem(t as ReferenceObject, doc));
  }

  if (method.errors !== undefined) {
    method.errors = method.errors.map((e) => derefItem(e as ReferenceObject, doc));
  }

  if (method.links !== undefined) {
    method.links = method.links.map((e) => derefItem(e as ReferenceObject, doc));
  }

  if (method.examples !== undefined) {
    method.examples = method.examples.map((ex) => derefItem(ex as ReferenceObject, doc));
    method.examples.map((ex) => {
      const exAsPairing = ex as ExamplePairingObject;
      exAsPairing.params = exAsPairing.params.map((exParam) => derefItem(exParam as ReferenceObject, doc));
      exAsPairing.result = derefItem(exAsPairing.result as ReferenceObject, doc);
      return exAsPairing;
    });
  }

  method.params = method.params.map((p) => derefItem(p as ReferenceObject, doc));
  method.result = derefItem((method.result as ReferenceObject), doc);


  let componentSchemas: SchemaComponents = {};
  if (doc.components && doc.components.schemas) {
    componentSchemas = doc.components.schemas as SchemaComponents;
  }

  const params = method.params as ContentDescriptorObject[];
  params.forEach(async (p) => {
    p.schema = await handleSchemaWithSchemaComponents(p.schema, componentSchemas);
  });

  const result = method.result as ContentDescriptorObject;

  result.schema = await handleSchemaWithSchemaComponents(result.schema, componentSchemas);

  return method;
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
    let derefDoc = { ...openrpcDocument };

    derefDoc = await handleSchemaComponents(derefDoc);
    derefDoc = await handleSchemasInsideContentDescriptorComponents(derefDoc);
    derefDoc.methods = await Promise.all(derefDoc.methods.map((method) => handleMethod(method, derefDoc)));

    return derefDoc;
  };
};

export default makeDereferenceDocument;
