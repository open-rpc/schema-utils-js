import Dereferencer from "@json-schema-tools/dereferencer";
import { OpenrpcDocument as OpenRPC, ReferenceObject, ExamplePairingObject, JSONSchema, SchemaComponents, ContentDescriptorComponents, ContentDescriptorObject, OpenrpcDocument, MethodObject } from "@open-rpc/meta-schema";
import referenceResolver from "@json-schema-tools/reference-resolver";

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

const derefItem = async (item: ReferenceObject, doc: OpenRPC) => {
  const { $ref } = item;
  if ($ref === undefined) { return item; }

  try {
    return await referenceResolver($ref, doc);
  } catch (err) {
    throw new OpenRPCDocumentDereferencingError([
      `unable to eval pointer against OpenRPC Document.`,
      `error type: ${err.name}`,
      `instance: ${err.instance}`,
      `token: ${err.token}`,
      `pointer: ${$ref}`,
    ].join("\n"));
  }
};

const derefItems = async (items: ReferenceObject[], doc: OpenRPC) => {
  const dereffed = [];
  for (const i of items) {
    dereffed.push(await derefItem(i, doc))
  }
  return dereffed;
};

const handleSchemaWithSchemaComponents = async (s: JSONSchema, schemaComponents: SchemaComponents | undefined) => {
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

  for (const k of schemaKeys) {
    schemas[k] = await handleSchemaWithSchemaComponents(schemas[k], schemas);
  }

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

  let componentSchemas: SchemaComponents = {};
  if (doc.components.schemas) {
    componentSchemas = doc.components.schemas as SchemaComponents;
  }

  for (const cdK of cdsKeys) {
    cds[cdK].schema = await handleSchemaWithSchemaComponents(cds[cdK].schema, componentSchemas);
  }

  return doc;
};

const handleMethod = async (method: MethodObject, doc: OpenrpcDocument): Promise<MethodObject> => {
  if (method.tags !== undefined) {
    method.tags = await derefItems(method.tags as ReferenceObject[], doc);
  }

  if (method.errors !== undefined) {
    method.errors = await derefItems(method.errors as ReferenceObject[], doc);
  }

  if (method.links !== undefined) {
    method.links = await derefItems(method.links as ReferenceObject[], doc);
  }

  if (method.examples !== undefined) {
    method.examples = await derefItems(method.examples as ReferenceObject[], doc);
    for (const exPairing of method.examples as ExamplePairingObject[]) {
      exPairing.params = await derefItems(exPairing.params as ReferenceObject[], doc);
      exPairing.result = await derefItem(exPairing.result as ReferenceObject, doc);
    }
  }

  method.params = await derefItems(method.params as ReferenceObject[], doc);
  method.result = await derefItem(method.result as ReferenceObject, doc);


  let componentSchemas: SchemaComponents = {};
  if (doc.components && doc.components.schemas) {
    componentSchemas = doc.components.schemas as SchemaComponents;
  }

  const params = method.params as ContentDescriptorObject[];

  for (const p of params) {
    p.schema = await handleSchemaWithSchemaComponents(p.schema, componentSchemas);
  }

  const result = method.result as ContentDescriptorObject;
  result.schema = await handleSchemaWithSchemaComponents(result.schema, componentSchemas);

  return method;
};

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
export default async function dereferenceDocument(openrpcDocument: OpenRPC): Promise<OpenRPC> {
  let derefDoc = { ...openrpcDocument };

  derefDoc = await handleSchemaComponents(derefDoc);
  derefDoc = await handleSchemasInsideContentDescriptorComponents(derefDoc);
  const methods = [] as any;
  for (const method of derefDoc.methods) {
    methods.push(await handleMethod(method, derefDoc));
  }

  derefDoc.methods = methods;

  return derefDoc;
}
