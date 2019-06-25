import MethodCallMethodNotFoundError from "./method-not-found-error";
import { OpenRPC } from "@open-rpc/meta-schema";

const exampleDoc = {
  info: {
    title: "testerino",
    version: "123",
  },
  methods: [],
  openrpc: "1.1.9",
} as OpenRPC;

describe("MethodCallMethodNotFoundError", () => {
  it("can be instantiated", () => {
    const error = new MethodCallMethodNotFoundError("floobar", exampleDoc, ["abc", 123]);
    expect(error).toBeInstanceOf(MethodCallMethodNotFoundError);
  });

  it("works when no params passed", () => {
    const error = new MethodCallMethodNotFoundError("floobar", exampleDoc);
    expect(error).toBeInstanceOf(MethodCallMethodNotFoundError);
  });

  it("properly parses params in to a string", () => {
    const error = new MethodCallMethodNotFoundError("floobar", exampleDoc, ["abc", { abc: 123 }, 123]);
    expect(error).toBeInstanceOf(MethodCallMethodNotFoundError);
    expect(error.message).toBe(`Method Not Found Error for OpenRPC API named "testerino"
The requested method: "floobar" not a valid method.

debug info:
  params: "abc", {"abc":123}, 123`);
  });

  it("it handles openrpc docs with a method", () => {
    exampleDoc.methods = [
      {
        name: "dooptiedoo",
        params: [],
        result: {
          name: "dooptie",
          schema: {},
        },
      },
    ];
    const error = new MethodCallMethodNotFoundError("floobar", exampleDoc, ["abc", { abc: 123 }, 123]);
    expect(error).toBeInstanceOf(MethodCallMethodNotFoundError);
    expect(error.message).toContain("Valid method names are as follows: dooptiedoo");
  });
});
