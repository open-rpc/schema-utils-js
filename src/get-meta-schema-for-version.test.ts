import getMetaSchemaForVersion from "./get-meta-schema-for-version";

describe("getMetaSchemaForVersion", () => {
  it("should successfully apply extension spec to meta schema", () => {
    const result = getMetaSchemaForVersion("1.3");
    expect(result).toBeDefined();
    expect(result.properties["openrpc"].enum).toContain("1.3.2");

    const result1_4 = getMetaSchemaForVersion("1.4");
    expect(result1_4).toBeDefined();
    expect(result1_4.properties["openrpc"].regex).toContain("4");
  });

  it("should throw an error for an unsupported version", () => {
    expect(() => getMetaSchemaForVersion("99.9")).toThrow(
      "Unsupported OpenRPC schema version: 99.9"
    );
  });
});
