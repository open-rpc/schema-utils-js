import MethodCallValidator from "./method-call-validator";
import { OpenRPC } from "@open-rpc/meta-schema";
import MethodCallParameterValidationError from "./parameter-validation-error";
import MethodCallMethodNotFoundError from "./method-not-found-error";

const getExampleSchema = (): OpenRPC => ({
  info: { title: "123", version: "1" },
  methods: [
    {
      name: "foo",
      params: [{ name: "foofoo", schema: { type: "string" } }],
      result: { name: "foofoo", schema: { type: "integer" } },
    },
    {
      name: "externalReference",
      params: [{ name: "extRef", schema: { $ref: "#/components/schemas/ExtRef" } }],
      result: { name: "extRefResult", schema: { $ref: "#/components/schemas/ExtRef" } },
    },
  ],
  components: {
    schemas: {
      ExtRef: {
        title: "extRef",
        type: "object",
        required: [
          "reference",
        ],
        properties: {
          reference: {
            type: "string",
          }
        }
      }
    }
  },
  openrpc: "1.0.0-rc1",
}) as OpenRPC;

describe("MethodCallValidator", () => {
  it("can be instantiated", () => {
    const example = getExampleSchema();
    expect(new MethodCallValidator(example)).toBeInstanceOf(MethodCallValidator);
  });

  it("can validate a method call", async () => {
    const example = getExampleSchema();
    const methodCallValidator = new MethodCallValidator(example);
    let result = await methodCallValidator.validate("foo", ["foobar"]);
    expect(result).toEqual([]);
    result = await methodCallValidator.validate("externalReference", [{ "reference": "extra" }]);
    expect(result).toEqual([]);
  });

  it("can handle having params undefined", async () => {
    const example = getExampleSchema();
    delete example.methods[0].params;
    const methodCallValidator = new MethodCallValidator(example);
    const result = await methodCallValidator.validate("foo", ["foobar"]);
    expect(result).toEqual([]);
  });

  it("can handle having schema undefined", async () => {
    const example = getExampleSchema() as any;
    delete example.methods[0].params[0].schema;
    const methodCallValidator = new MethodCallValidator(example);
    const result = await methodCallValidator.validate("foo", ["foobar"]);
    expect(result).toEqual([]);
  });

  it("returns array of errors if invalid", async () => {
    const example = getExampleSchema() as any;
    const methodCallValidator = new MethodCallValidator(example);
    let result = await methodCallValidator.validate("foo", [123]) as MethodCallParameterValidationError[];
    expect(result.length).toBe(1);
    expect(result[0]).toBeInstanceOf(MethodCallParameterValidationError);

    result = await methodCallValidator.validate("externalReference", [123]) as MethodCallParameterValidationError[];
    expect(result.length).toBe(1);
    expect(result[0]).toBeInstanceOf(MethodCallParameterValidationError);

  });

  it("can not error if param is optional", async () => {
    const example = getExampleSchema() as any;
    const methodCallValidator = new MethodCallValidator(example);
    const result = await methodCallValidator.validate("foo", []);
    expect(result).toEqual([]);
  });

  it("rpc.discover is allowed", async () => {
    const example = getExampleSchema() as any;
    const methodCallValidator = new MethodCallValidator(example);
    const result = await methodCallValidator.validate("rpc.discover", []);
    expect(result).toEqual([]);
  });

  it("returns method not found error when the method name is invalid", async () => {
    const example = getExampleSchema() as any;
    const methodCallValidator = new MethodCallValidator(example);
    const result = await methodCallValidator.validate("boo", ["123"]);
    expect(result).toBeInstanceOf(MethodCallMethodNotFoundError);
  });
});
