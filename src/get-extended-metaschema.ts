import metaSchema from "@open-rpc/meta-schema";
import { metaSchema as extensionMetaSchema } from "@open-rpc/specification-extension-spec";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getExtendedMetaSchema(): any {
  // NOTE: this is to make sure we don't mutate the original meta schema
  const metaSchemaCopy = JSON.parse(JSON.stringify(metaSchema));
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const extensionMetaSchemaCopy = { ...extensionMetaSchema } as any;

  // Process the extension and meta schema to remove the $id and $schema properties
  delete extensionMetaSchemaCopy.$schema;
  delete extensionMetaSchemaCopy.$id;
  delete metaSchemaCopy.definitions.JSONSchema.$id;
  delete metaSchemaCopy.definitions.JSONSchema.$schema;
  delete metaSchemaCopy.$schema;
  delete metaSchemaCopy.$id;
  metaSchemaCopy.properties["x-extensions"] = {
    $ref: "#/definitions/x-extensions",
  };
  metaSchemaCopy.definitions["x-extensions"] = {
    type: "array",
    items: extensionMetaSchemaCopy,
  };
  //extensionMetaSchemaCopy.properties["x-extensions"];
  return metaSchemaCopy;
}

export default getExtendedMetaSchema;
