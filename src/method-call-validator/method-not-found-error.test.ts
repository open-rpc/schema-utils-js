import MethodNotFoundError from "./method-not-found-error";
import { OpenrpcDocument as OpenRPC } from "@open-rpc/meta-schema";

const exampleDoc = {
  info: {
    title: "testerino",
    version: "123",
  },
  methods: [],
  openrpc: "1.1.9",
} as OpenRPC;

describe("MethodNotFoundError", () => {
  it("can be instantiated", () => {
    const error = new MethodNotFoundError("floobar", exampleDoc, ["abc", 123]);
    expect(error).toBeInstanceOf(MethodNotFoundError);
  });

  it("works when no params passed", () => {
    const error = new MethodNotFoundError("floobar", exampleDoc);
    expect(error).toBeInstanceOf(MethodNotFoundError);
  });

  it("works when params are not an array of valid values", () => {
    const obj = {
      name: "Example",
      circular: {},
    };
    obj.circular = obj; // Circular reference

    const error = new MethodNotFoundError("floobar", exampleDoc, [obj]);
    expect(error).toBeInstanceOf(MethodNotFoundError);
  });

  it("works when params are an object", () => {
    const error = new MethodNotFoundError("floobar", exampleDoc, { test: "param" });
    expect(error).toBeInstanceOf(MethodNotFoundError);
  });

  it("properly parses params in to a string", () => {
    const error = new MethodNotFoundError("floobar", exampleDoc, ["abc", { abc: 123 }, 123]);
    expect(error).toBeInstanceOf(MethodNotFoundError);
    expect(error.message).toBe(`Method Not Found Error for OpenRPC API named "testerino"
The requested method: "floobar" not a valid method.
Params:
"abc"
{"abc":123}
123`);
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
    const error = new MethodNotFoundError("floobar", exampleDoc, ["abc", { abc: 123 }, 123]);
    expect(error).toBeInstanceOf(MethodNotFoundError);
    expect(error.message).toContain("Valid method names are as follows: dooptiedoo");
  });
});
