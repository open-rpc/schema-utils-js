import MethodTypings from ".";
import { OpenRPC } from "@open-rpc/meta-schema";

const testOpenRPCDocument = {
  info: {
    title: "jipperjobber",
    version: "3.2.1",
  },
  methods: [
    {
      name: "jibber",
      params: [],
      result: {
        name: "ripslip",
        schema: {},
      },
    },
  ],
  openrpc: "1.0.0",
} as OpenRPC;

describe("MethodTypings", () => {

  it("can be constructed", () => {
    expect(new MethodTypings(testOpenRPCDocument)).toBeInstanceOf(MethodTypings);
  });

  it("can generate typings map", async () => {
    const methodTypings = new MethodTypings(testOpenRPCDocument);

    await methodTypings.generateTypings();

    expect(methodTypings).toBeInstanceOf(MethodTypings);
  });

  describe("getAllUniqueTypings", () => {

    it("throws if types not generated yet", () => {
      const methodTypings = new MethodTypings(testOpenRPCDocument);
      expect(() => methodTypings.getAllUniqueTypings("typescript")).toThrow();
    });

    describe("typscript", () => {

      it("returns a string of typings where the typeNames are unique", async () => {
        const methodTypings = new MethodTypings(testOpenRPCDocument);
        await methodTypings.generateTypings();

        expect(methodTypings.getAllUniqueTypings("typescript")).toBe([
          "export interface IRipslip {",
          "  [k: string]: any;",
          "}",
          "",
        ].join("\n"));
      });

    });

    describe("rust", () => {

      it("returns a string of typings where the typeNames are unique", async () => {
        const methodTypings = new MethodTypings(testOpenRPCDocument);
        await methodTypings.generateTypings();

        expect(methodTypings.getAllUniqueTypings("rust")).toBe("pub type Ripslip = Option<serde_json::Value>;");
      });

    });
  });

  describe("getFunctionSignature", () => {

    it("throws if types not generated yet", async () => {
      const methodTypings = new MethodTypings(testOpenRPCDocument);
      expect(() => methodTypings.getFunctionSignature(testOpenRPCDocument.methods[0], "typescript")).toThrow();
    });

    describe("typescript", () => {

      it("returns the function signature for a method", async () => {
        const methodTypings = new MethodTypings(testOpenRPCDocument);
        await methodTypings.generateTypings();

        expect(methodTypings.getFunctionSignature(testOpenRPCDocument.methods[0], "typescript"))
          .toBe("public jibber() : Promise<IRipslip>");
      });

    });

    describe("rust", () => {

      it("returns the function signature for a method", async () => {
        const methodTypings = new MethodTypings(testOpenRPCDocument);
        await methodTypings.generateTypings();

        expect(methodTypings.getFunctionSignature(testOpenRPCDocument.methods[0], "rust"))
          .toBe("pub fn jibber(&mut self) -> RpcRequest<Ripslip>;");
      });

    });
  });
});
