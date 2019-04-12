import { types } from "@open-rpc/meta-schema";
import validateOpenRPCDocument from "./validate-open-rpc-document";

describe("validateOpenRPCDocument", () => {
  it("errors when passed an incorrect schema", () => {
    const testSchema: types.OpenRPC = {
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
