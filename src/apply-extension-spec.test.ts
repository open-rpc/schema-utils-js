import applyExtensionSpec from "./apply-extension-spec";
import getMetaSchemaForVersion from "./get-meta-schema-for-version";
import { OpenrpcDocument } from "./types";
import goodSchema from "./extension-good-schema.json";
import getExtendedMetaSchema from "./get-extended-metaschema";

describe("applyExtensionSpec", () => {
  it("should successfully apply extension spec to meta schema", () => {
    const result = applyExtensionSpec(goodSchema as OpenrpcDocument, getExtendedMetaSchema("1.3"));

    // Check if extension was applied to methodObject
    const methodObjectDef = result.definitions.methodObject;
    expect(methodObjectDef.properties["x-notification"]).toBeDefined();
    expect(methodObjectDef.properties["x-notification"].type).toBe("boolean");
    expect(methodObjectDef.properties["x-notification"].description).toBe(
      "Whether or not this method is a notification or not"
    );
    expect(methodObjectDef.properties["x-notification"].summary).toBe("OpenRPC Notification");
  });

  it("should handle multiple extensions", () => {
    const metaSchema = getMetaSchemaForVersion("1.3");
    const multiExtensionDoc = {
      ...goodSchema,
      "x-extensions": [
        ...goodSchema["x-extensions"],
        {
          ...goodSchema["x-extensions"][0],
          name: "x-another-extension",
          schema: { type: "string" },
        },
      ],
    };

    const result = applyExtensionSpec(multiExtensionDoc as OpenrpcDocument, metaSchema);
    const methodObjectDef = result.definitions.methodObject;

    expect(methodObjectDef.properties["x-notification"]).toBeDefined();
    expect(methodObjectDef.properties["x-another-extension"]).toBeDefined();
    expect(methodObjectDef.properties["x-another-extension"].type).toBe("string");
  });

  it("should return unmodified schema when x-extensions is empty", () => {
    const metaSchema = getMetaSchemaForVersion("1.3");
    const emptyExtensionsDoc = {
      ...goodSchema,
      "x-extensions": [],
    };

    const result = applyExtensionSpec(emptyExtensionsDoc as OpenrpcDocument, metaSchema);
    expect(result).toEqual(metaSchema);
  });

  it("should throw error when restricted schema definition doesn't exist", () => {
    const metaSchema = getMetaSchemaForVersion("1.3");
    const badDoc = {
      ...goodSchema,
      "x-extensions": [
        {
          ...goodSchema["x-extensions"][0],
          restricted: ["nonExistentDefinition"],
        },
      ],
    };

    expect(() => {
      applyExtensionSpec(badDoc as OpenrpcDocument, metaSchema);
    }).toThrow("nonExistentDefinition does not exist, cannot apply extension x-notification");
  });

  it("should throw error when extension property already exists", () => {
    const metaSchema = getMetaSchemaForVersion("1.3");
    const modifiedSchema = {
      ...metaSchema,
      definitions: {
        methodObject: {
          properties: {
            "x-notification": {}, // Already exists
          },
        },
      },
    };

    expect(() => {
      applyExtensionSpec(goodSchema as OpenrpcDocument, modifiedSchema);
    }).toThrow(
      "x-notification already exists in methodObject, cannot apply extension x-notification"
    );
  });
});
