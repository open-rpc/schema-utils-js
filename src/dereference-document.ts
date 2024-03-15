import Dereferencer from "@json-schema-tools/dereferencer";
import metaSchema, {
  OpenrpcDocument as OpenRPC,
  ReferenceObject,
  ExamplePairingObject,
  JSONSchema,
  SchemaComponents,
  ContentDescriptorComponents,
  ContentDescriptorObject,
  OpenrpcDocument,
  MethodObject,
  MethodOrReference,
} from "@open-rpc/meta-schema";
import referenceResolver from "@json-schema-tools/reference-resolver";
import safeStringify from "fast-safe-stringify";

export type ReferenceResolver = typeof referenceResolver;
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

const derefItem = async (item: ReferenceObject, doc: OpenRPC, resolver: ReferenceResolver) => {
  const { $ref } = item;
  if ($ref === undefined) {
    return item;
  }

  try {
    // returns resolved value of the reference
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (await resolver.resolve($ref, doc)) as any;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (err: any) {
    throw new OpenRPCDocumentDereferencingError(
      [
        `unable to eval pointer against OpenRPC Document.`,
        `error type: ${err.name}`,
        `instance: ${err.instance}`,
        `token: ${err.token}`,
        `pointer: ${$ref}`,
        `reference object: ${safeStringify(item)}`,
      ].join("\n")
    );
  }
};

const derefItems = async (items: ReferenceObject[], doc: OpenRPC, resolver: ReferenceResolver) => {
  const dereffed = [];
  for (const i of items) {
    dereffed.push(await derefItem(i, doc, resolver));
  }
  return dereffed;
};

const matchDerefItems = async (
  items: ReferenceObject[] | ReferenceObject,
  doc: OpenRPC,
  resolver: ReferenceResolver
) => {
  if (Array.isArray(items)) {
    return derefItems(items, doc, resolver);
  }
  return derefItem(items, doc, resolver);
};

const handleSchemaWithSchemaComponents = async (
  s: JSONSchema,
  schemaComponents: SchemaComponents | undefined
) => {
  if (s === true || s === false) {
    return Promise.resolve(s);
  }

  if (schemaComponents !== undefined) {
    s.components = { schemas: schemaComponents };
  }

  const dereffer = new Dereferencer(s);
  try {
    const dereffed = await dereffer.resolve();
    if (dereffed !== true && dereffed !== false) {
      delete dereffed.components;
      delete s.components;
    }
    return dereffed;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (e: any) {
    throw new OpenRPCDocumentDereferencingError(
      [
        "Unable to parse reference inside of JSONSchema",
        s.title ? `Schema Title: ${s.title}` : "",
        `error message: ${e.message}`,
        `schema in question: ${safeStringify(s)}`,
      ].join("\n")
    );
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

const handleSchemasInsideContentDescriptorComponents = async (
  doc: OpenrpcDocument
): Promise<OpenrpcDocument> => {
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

type DefinitionsMap = { [key: string]: string[] };

// remap the definitions map to remove the definitions. prefix and replace it with the parent object type
const remap = (definitionsMap: DefinitionsMap): DefinitionsMap => {
  const remappedDefinitions: DefinitionsMap = {};
  const graph = new Map<string, Set<string>>();
  const resolved = new Set<string>();

  // Build dependency graph
  for (const [key, paths] of Object.entries(definitionsMap)) {
    graph.set(key, new Set());
    for (const path of paths) {
      const parts = path.split(".");
      if (parts.length === 1) {
        graph.get(key)?.add(path);
      } else if (path.startsWith("definitions.")) {
        parts.shift(); // Remove 'definitions'
        const parentType = parts[0];
        if (parentType && parentType !== key) {
          graph.get(key)?.add(parentType);
        }
      }
    }
  }

  // Helper to resolve a definition and its dependencies
  const resolveDef = (key: string) => {
    if (resolved.has(key)) return;

    // Resolve dependencies first
    graph.get(key)?.forEach((dep) => resolveDef(dep));
    if (!definitionsMap[key]) {
      return key;
    }

    const accumulatedPaths: string[] = [];
    definitionsMap[key].forEach((path) => {
      if (!path.startsWith("definitions.")) {
        accumulatedPaths.push(path);
        return;
      }

      const parts = path.split(".");
      parts.shift(); // Remove 'definitions'
      const parentType = parts.shift();
      const remainingPath = parts.join(".");

      if (!parentType || !remappedDefinitions[parentType]) {
        accumulatedPaths.push(remainingPath);
        return;
      }

      remappedDefinitions[parentType].forEach((basePath: string) => {
        const newPath = basePath ? `${basePath}.${remainingPath}` : remainingPath;
        accumulatedPaths.push(newPath);
      });
    });
    remappedDefinitions[key] = accumulatedPaths;

    resolved.add(key);
  };

  // Resolve all definitions
  Object.keys(definitionsMap).forEach(resolveDef);

  return remappedDefinitions;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function createDefinitionsMap(schema: any, path = ""): DefinitionsMap {
  const definitionsMap: DefinitionsMap = {};

  const simplifyPath = (path: string): string => {
    // Remove .items, .patternProperties, and anything after them
    return path.split(/\.(items|patternProperties)/)[0];
  };

  const addToMap = (definitionName: string, currentPath: string) => {
    if (definitionName && definitionName !== "referenceObject") {
      if (!definitionsMap[definitionName]) {
        definitionsMap[definitionName] = [];
      }
      const simplifiedPath = simplifyPath(currentPath);
      if (simplifiedPath && !definitionsMap[definitionName].includes(simplifiedPath)) {
        definitionsMap[definitionName].push(simplifiedPath);
      }
    }
  };

  // Handle object properties recursively
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const traverseObject = (obj: any, currentPath: string) => {
    if (!obj || typeof obj !== "object") return;

    // Handle direct $ref
    if ("$ref" in obj) {
      const definitionName = obj["$ref"].split("/").pop();
      addToMap(definitionName, currentPath);
    }

    // Handle arrays with items
    if ("items" in obj) {
      // Direct $ref in items
      if (obj.items.$ref) {
        const definitionName = obj.items.$ref.split("/").pop();
        addToMap(definitionName, `${currentPath}.items`);
      }
      // oneOf in items
      if (obj.items.oneOf) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        obj.items.oneOf.forEach((item: any) => {
          if (item.$ref) {
            const definitionName = item.$ref.split("/").pop();
            addToMap(definitionName, `${currentPath}.items`);
          }
        });
      }
    }

    // Handle properties
    if ("properties" in obj) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      Object.entries(obj.properties).forEach(([key, value]: [string, any]) => {
        const newPath = currentPath ? `${currentPath}.${key}` : key;
        traverseObject(value, newPath);
      });
    }

    // Handle oneOf at current level
    if ("oneOf" in obj) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      obj.oneOf.forEach((item: any) => {
        if (item.$ref) {
          const definitionName = item.$ref.split("/").pop();
          addToMap(definitionName, currentPath);
        }
        traverseObject(item, currentPath);
      });
    }

    // Recursively traverse all other properties
    Object.entries(obj).forEach(([key, value]) => {
      if (
        value &&
        typeof value === "object" &&
        key !== "properties" &&
        key !== "items" &&
        key !== "oneOf"
      ) {
        const newPath = currentPath ? `${currentPath}.${key}` : key;
        traverseObject(value, newPath);
      }
    });
  };

  traverseObject(schema, path);

  return remap(definitionsMap);
}

function resolveDefinition(definitionsMap: DefinitionsMap, definitionKey: string): string[] {
  return definitionsMap[definitionKey] || [];
}

interface DocResult {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  items: any[]; // Single array of all matching objects
}

// Traverses an object based on a dot-separated path and returns all matching objects at that path
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const getDoc = (docName: string, derefDoc: any): DocResult => {
  const docNames = docName.split(".");

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const traverseObject = (obj: any, pathParts: string[]): any[] => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const results: any[] = [];

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const traverse = (current: any, depth: number) => {
      if (!current) return;

      // If we've reached our target depth, collect this object
      if (depth === pathParts.length) {
        results.push(current);
        return;
      }

      const part = pathParts[depth];
      const next = current[part];

      // Handle both arrays and objects
      if (Array.isArray(next)) {
        next.forEach((item) => traverse(item, depth + 1));
      } else if (next && typeof next === "object") {
        traverse(next, depth + 1);
      }
    };

    traverse(obj, 0);
    return results;
  };

  return { items: traverseObject(derefDoc, docNames) };
};

/* eslint-disable @typescript-eslint/no-explicit-any */
const handleExtension = async (
  extensionOrRef: any,
  doc: OpenrpcDocument,
  resolver: ReferenceResolver
): Promise<any> => {
  if (extensionOrRef.$ref !== undefined) {
    extensionOrRef = await derefItem({ $ref: extensionOrRef.$ref }, doc, resolver);
  }

  let componentSchemas: SchemaComponents = {};
  if (doc.components && doc.components.schemas) {
    componentSchemas = doc.components.schemas as SchemaComponents;
  }

  if (extensionOrRef.schema !== undefined) {
    extensionOrRef.schema = await handleSchemaWithSchemaComponents(
      extensionOrRef.schema,
      componentSchemas
    );
  }

  return extensionOrRef;
};
/* eslint-enable @typescript-eslint/no-explicit-any */

const handleMethod = async (
  methodOrRef: MethodOrReference,
  doc: OpenrpcDocument,
  resolver: ReferenceResolver
): Promise<MethodObject> => {
  let method = methodOrRef as MethodObject;

  if (methodOrRef.$ref !== undefined) {
    method = await derefItem({ $ref: methodOrRef.$ref }, doc, resolver);
  }

  if (method.tags !== undefined) {
    method.tags = await derefItems(method.tags as ReferenceObject[], doc, resolver);
  }

  if (method.errors !== undefined) {
    method.errors = await derefItems(method.errors as ReferenceObject[], doc, resolver);
  }

  if (method.links !== undefined) {
    method.links = await derefItems(method.links as ReferenceObject[], doc, resolver);
  }

  if (method.examples !== undefined) {
    method.examples = await derefItems(method.examples as ReferenceObject[], doc, resolver);
    for (const exPairing of method.examples as ExamplePairingObject[]) {
      exPairing.params = await derefItems(exPairing.params as ReferenceObject[], doc, resolver);
      if (exPairing.result !== undefined) {
        exPairing.result = await derefItem(exPairing.result as ReferenceObject, doc, resolver);
      }
    }
  }

  method.params = await derefItems(method.params as ReferenceObject[], doc, resolver);
  if (method.result !== undefined) {
    method.result = await derefItem(method.result as ReferenceObject, doc, resolver);
  }

  let componentSchemas: SchemaComponents = {};
  if (doc.components && doc.components.schemas) {
    componentSchemas = doc.components.schemas as SchemaComponents;
  }

  const params = method.params as ContentDescriptorObject[];

  for (const p of params) {
    p.schema = await handleSchemaWithSchemaComponents(p.schema, componentSchemas);
  }

  if (method.result !== undefined) {
    const result = method.result as ContentDescriptorObject;
    result.schema = await handleSchemaWithSchemaComponents(result.schema, componentSchemas);
  }

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
 * import { OpenRPC } from "@open-rpc/meta-schema"
 * import { dereferenceDocument } from "@open-rpc/schema-utils-js";
 *
 * try {
 *   const dereffedDocument = await dereferenceDocument({ ... }) as OpenRPC;
 * } catch (e) {
 *   // handle validation errors
 * }
 * ```
 *
 */
export default async function dereferenceDocument(
  openrpcDocument: OpenRPC,
  resolver: ReferenceResolver = referenceResolver
): Promise<OpenRPC> {
  let derefDoc = { ...openrpcDocument };

  derefDoc = await handleSchemaComponents(derefDoc);
  derefDoc = await handleSchemasInsideContentDescriptorComponents(derefDoc);

  const definitionsMap = createDefinitionsMap(metaSchema);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const extensions = [] as any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const extensionDerefs = [] as any;

  if (derefDoc["x-extensions"]) {
    for (const extension of derefDoc["x-extensions"]) {
      const derefedExtension = await handleExtension(extension, derefDoc, resolver);
      extensions.push(derefedExtension);
      for (const def of derefedExtension.restricted) {
        extensionDerefs.push({
          extensionName: derefedExtension.name,
          docNames: resolveDefinition(definitionsMap, def),
        });
      }
    }
    derefDoc["x-extensions"] = extensions;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const methods = [] as any;
  for (const method of derefDoc.methods) {
    methods.push(await handleMethod(method, derefDoc, resolver));
  }

  for (const extension of extensionDerefs) {
    for (const docName of extension.docNames) {
      const { items } = getDoc(docName, derefDoc);

      // Process all matching items that have the extension
      for (const item of items) {
        if (item && item[extension.extensionName]) {
          item[extension.extensionName] = await matchDerefItems(
            item[extension.extensionName],
            derefDoc,
            resolver
          );
        }
      }
    }
  }

  derefDoc.methods = methods;

  return derefDoc;
}
