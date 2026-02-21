import getMetaSchemaForVersion from "./get-meta-schema-for-version";

describe("getMetaSchemaForVersion", () => {
  it("should successfully apply extension spec to meta schema", () => {
    const result = getMetaSchemaForVersion("1.3");
    expect(result).toBeDefined();
    if ("enum" in result.properties["openrpc"]) {
      expect(result.properties["openrpc"].enum).toContain("1.3.2");
    } else {
      throw new Error("OpenRPC schema version 1.3 is not supported");
    }

    const result1_4 = getMetaSchemaForVersion("1.4");
    expect(result1_4).toBeDefined();
    if ("regex" in result1_4.properties["openrpc"]) {
      expect(result1_4.properties["openrpc"].regex).toContain("4");
    } else {
      throw new Error("OpenRPC schema version 1.4 is not supported");
    }
  });

  it("should throw an error for an unsupported version", () => {
    expect(() => getMetaSchemaForVersion("99.9")).toThrow(
      "Unsupported OpenRPC schema version: 99.9"
    );
  });
});
