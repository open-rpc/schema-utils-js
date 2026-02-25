import getDocumentExtendedMetaSchema from "./get-document-extended-metaschema";
import goodSchema from "./extension-good-schema.json";
import { OpenrpcDocument } from "./types";

describe("getDocumentExtendedMetaSchema", () => {
  it("should successfully apply extension spec to meta schema", () => {
    const result = getDocumentExtendedMetaSchema(goodSchema as OpenrpcDocument);

    // Check if extension was applied to methodObject
    const methodObjectDef = result.definitions.methodObject;
    expect(methodObjectDef.properties["x-notification"]).toBeDefined();
    expect(methodObjectDef.properties["x-notification"].type).toBe("boolean");
    expect(methodObjectDef.properties["x-notification"].description).toBe(
      "Whether or not this method is a notification or not"
    );
    expect(methodObjectDef.properties["x-notification"].summary).toBe("OpenRPC Notification");
  });
});
