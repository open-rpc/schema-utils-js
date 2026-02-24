import applyExtensionSpec from "./apply-extension-spec";
import { OpenrpcDocument } from "@open-rpc/meta-schema";
import goodSchema from "./extension-good-schema.json";
import getExtendedMetaSchema from "./get-extended-metaschema";

describe("applyExtensionSpec", () => {
  it("should successfully apply extension spec to meta schema", () => {
    const result = applyExtensionSpec(goodSchema as OpenrpcDocument, getExtendedMetaSchema());

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

    const result = applyExtensionSpec(
      multiExtensionDoc as OpenrpcDocument,
      getExtendedMetaSchema()
    );
    const methodObjectDef = result.definitions.methodObject;

    expect(methodObjectDef.properties["x-notification"]).toBeDefined();
    expect(methodObjectDef.properties["x-another-extension"]).toBeDefined();
    expect(methodObjectDef.properties["x-another-extension"].type).toBe("string");
  });

  it("should return unmodified schema when x-extensions is empty", () => {
    const emptyExtensionsDoc = {
      ...goodSchema,
      "x-extensions": [],
    };

    const schema = getExtendedMetaSchema();
    const result = applyExtensionSpec(emptyExtensionsDoc as OpenrpcDocument, schema);
    expect(result).toEqual(schema);
  });

  it("should throw error when restricted schema definition doesn't exist", () => {
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
      applyExtensionSpec(badDoc as OpenrpcDocument, getExtendedMetaSchema());
    }).toThrow("nonExistentDefinition does not exist, cannot apply extension x-notification");
  });

  it("should allow restricted schema definition by extension name", () => {
    const doc = {
      ...goodSchema,
      "x-extensions": [
        {
          ...goodSchema["x-extensions"][0],
          name: "x-error-groups",
          restricted: ["methodObject"],
          schema: {
            type: "object",
            properties: {
              id: { type: "string" },
              title: { type: "string" },
              description: { type: "string" },
            },
          },
        },
        {
          ...goodSchema["x-extensions"][0],
          name: "x-next",
          restricted: ["x-error-groups"], //search everything for key with x-error-groups
          schema: {
            type: "boolean",
          },
        },
      ],
    };

    const result = applyExtensionSpec(doc as OpenrpcDocument, getExtendedMetaSchema());
    expect(result.definitions["x-error-groups"]).toBeDefined();
    expect(result.definitions["x-error-groups"].properties["x-next"]).toBeDefined();
    expect(result.definitions["x-error-groups"].properties["x-next"].type).toBe("boolean");
  });

  it("should throw error when extension name already exists in definitions", () => {
    const doc = {
      ...goodSchema,
      "x-extensions": [
        {
          ...goodSchema["x-extensions"][0],
          name: "methodObject",
        },
      ],
    };

    expect(() => {
      applyExtensionSpec(doc as OpenrpcDocument, getExtendedMetaSchema());
    }).toThrow("methodObject already exists in definitions, cannot apply extension methodObject");
  });

  it("should throw error when extension property already exists", () => {
    const schema = getExtendedMetaSchema();
    const modifiedSchema = {
      ...schema,
      definitions: {
        ...schema.definitions,
        methodObject: {
          ...schema.definitions.methodObject,
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
