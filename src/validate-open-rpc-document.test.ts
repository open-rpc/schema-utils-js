import validateOpenRPCDocument, { OpenRPCDocumentValidationError } from "./validate-open-rpc-document";
import { OpenrpcDocument } from "@open-rpc/meta-schema";

describe("validateOpenRPCDocument", () => {
  it("errors when passed an incorrect schema", () => {
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
    expect(result).toBeInstanceOf(OpenRPCDocumentValidationError)
  });
});
