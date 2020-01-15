import validateOpenRPCDocument from "./validate-open-rpc-document";
import { OpenrpcDocument as OpenRPC } from "@open-rpc/meta-schema";

describe("validateOpenRPCDocument", () => {
  it("errors when passed an incorrect schema", () => {
    const testSchema: any = {
      info: {
        afooblared: 123,
        title: "foobar",
        version: "1",
      },
      methods: [],
      openrpc: "1.0.0-rc1",
    };
    const result = validateOpenRPCDocument(testSchema);

    expect(result).not.toBe(null);
  });
});
