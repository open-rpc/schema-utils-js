import MethodRefUnexpectedError from "./method-ref-unexpected-error";
import { OpenrpcDocument as OpenRPC } from "@open-rpc/meta-schema";

const exampleDoc = {
  info: {
    title: "testerino",
    version: "123",
  },
  methods: [],
  openrpc: "1.1.9",
} as OpenRPC;

describe("MethodRefUnexpectedError", () => {
  it("can be instantiated", () => {
    const error = new MethodRefUnexpectedError("#/components/stuff/floobar", exampleDoc);
    expect(error).toBeInstanceOf(MethodRefUnexpectedError);
  });
});

