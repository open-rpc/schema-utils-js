import validateOpenRPCDocument, {
  OpenRPCDocumentValidationError,
} from "./validate-open-rpc-document";
import { OpenrpcDocument } from "@open-rpc/meta-schema";
import Ajv from "ajv";

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
  it("throws an error when ajv throws an error", () => {
    const validateMock = jest
      .spyOn(Ajv.prototype, "validate")
      .mockImplementation(() => {
        throw new Error('bonk')
      })
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
    expect(() => {
      validateOpenRPCDocument(testSchema as OpenrpcDocument);
    }).toThrowError('schema-utils-js');
    validateMock.mockRestore();
  });
});
