import { OpenrpcDocument as OpenRPC } from "./types";

/**
 * Applies extension specifications to an OpenRPC document by modifying the meta schema
 * @param document - The OpenRPC document containing x-extensions
 * @param metaSchema - The meta schema to extend
 * @returns The modified meta schema with extensions applied
 * @throws {Error} If the schema definition doesn't exist or if extension name conflicts
 */
// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types, @typescript-eslint/no-explicit-any
function applyExtensionSpec(document: OpenRPC, metaSchema: any): any {
  const extendedMetaSchema = metaSchema;

  if (!document["x-extensions"]) return extendedMetaSchema;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  document["x-extensions"].forEach((extension: any) => {
    const { name, schema, summary, description, restricted } = extension;

    if (extendedMetaSchema.definitions[name]) {
      throw new Error(`${name} already exists in definitions, cannot apply extension ${name}`);
    }

    restricted.forEach((schemaDefinition: string) => {
      const def = extendedMetaSchema.definitions[schemaDefinition];

      if (!def)
        throw new Error(`${schemaDefinition} does not exist, cannot apply extension ${name}`);

      if (def.properties[name])
        throw new Error(
          `${name} already exists in ${schemaDefinition}, cannot apply extension ${name}`
        );

      def.properties[name] = {
        title: name,
        description,
        summary,
        ...schema,
      };
      extendedMetaSchema.definitions[name] = def.properties[name];
    });
  });

  return extendedMetaSchema;
}

export default applyExtensionSpec;
