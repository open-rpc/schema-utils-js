import validateOpenRPCDocument, { OpenRPCDocumentValidationError } from "./validate-open-rpc-document";
import { OpenrpcDocument } from "@open-rpc/meta-schema";
import dummyDoc from "./extension-good-schema.json"

describe("validateOpenRPCDocument", () => {
  it.only("errors when passed an incorrect document", () => {
    const testSchema = {
      info: {
        afooblared: 123,
        title: "foobar",
        version: "1",
      },
      methods: [],
      openrpc: "1.0.0-rc1",
    };
    const result = validateOpenRPCDocument(dummyDoc as OpenrpcDocument);

    expect(result).not.toBe(null);
    //expect(result).toBeInstanceOf(OpenRPCDocumentValidationError)
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
              type: "not real"
            }
          }
        }
      ],
      openrpc: "1.0.0-rc1",
    };
    const result = validateOpenRPCDocument(testSchema as OpenrpcDocument);
    expect(result).not.toBe(null);
    expect(result).toBeInstanceOf(OpenRPCDocumentValidationError)
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
              $ref: `${__dirname}/good-schema.json`
            }
          }
        }
      ],
      openrpc: "1.0.0-rc1",
    };
    const result = validateOpenRPCDocument(testSchema as OpenrpcDocument);
    expect(result).toBe(true);
    expect(result).not.toBeInstanceOf(OpenRPCDocumentValidationError)
  });

});
