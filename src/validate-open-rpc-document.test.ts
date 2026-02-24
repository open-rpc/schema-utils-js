import validateOpenRPCDocument, {
  OpenRPCDocumentValidationError,
} from "./validate-open-rpc-document";
import { OpenrpcDocument } from "@open-rpc/meta-schema";
import goodExtensionSchema from "./extension-good-schema.json";
import badExtensionSchema from "./extension-bad-schema.json";

describe("validateOpenRPCDocument", () => {
  it("errors when passed an incorrect document", () => {
    const testSchema = {
      info: {
        afooblared: 123,
        title: "foobar",
        version: "1",
      },
      methods: [],
      openrpc: "1.0.0-rc1",
    };
    const result = validateOpenRPCDocument(testSchema as OpenrpcDocument);

    expect(result).not.toBe(null);
    expect(result).toBeInstanceOf(OpenRPCDocumentValidationError);
  });

  it("errors when a document is corrupted", () => {
    expect(() => validateOpenRPCDocument(undefined as unknown as OpenrpcDocument)).toThrow(
      "schema-utils-js: Internal Error"
    );
  });

  it("errors when passed an incorrect doc that is deep", () => {
    expect.assertions(2);
    const testSchema = {
      info: {
        title: "foobar",
        version: "1",
      },
      methods: [
        {
          name: "foo",
          params: [],
          result: {
            name: "foobar",
            schema: {
              type: "not real",
            },
          },
        },
      ],
      openrpc: "1.0.0-rc1",
    };
    const result = validateOpenRPCDocument(testSchema as OpenrpcDocument);
    expect(result).not.toBe(null);
    expect(result).toBeInstanceOf(OpenRPCDocumentValidationError);
  });

  it("works fine whn there are file refs", () => {
    expect.assertions(2);
    const testSchema = {
      info: {
        title: "foobar",
        version: "1",
      },
      methods: [
        {
          name: "foo",
          params: [],
          result: {
            name: "foobar",
            schema: {
              $ref: `${__dirname}/good-schema.json`,
            },
          },
        },
      ],
      openrpc: "1.0.0-rc1",
    };

    const result = validateOpenRPCDocument(testSchema as OpenrpcDocument);
    expect(result).toBe(true);
    expect(result).not.toBeInstanceOf(OpenRPCDocumentValidationError);
  });

  it("supports extensions", () => {
    const result = validateOpenRPCDocument(goodExtensionSchema as OpenrpcDocument);
    expect(result).toBe(true);
    expect(result).not.toBeInstanceOf(OpenRPCDocumentValidationError);
  });

  it("errors when extensions are not valid", () => {
    const result = validateOpenRPCDocument(badExtensionSchema as OpenrpcDocument);
    expect(result).not.toBe(null);
    expect(result).toBeInstanceOf(OpenRPCDocumentValidationError);
  });
});
