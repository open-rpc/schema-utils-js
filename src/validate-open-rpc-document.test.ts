import validateOpenRPCDocument from "./validate-open-rpc-document";
import { OpenRPC } from "@open-rpc/meta-schema";

describe("validateOpenRPCDocument", () => {
  it("errors when passed an incorrect schema", () => {
    const testSchema: OpenRPC = {
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
