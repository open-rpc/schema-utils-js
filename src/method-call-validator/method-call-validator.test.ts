import MethodCallValidator from "./method-call-validator";
import { MethodObject, OpenrpcDocument as OpenRPC, OpenrpcDocument } from "../types";
import MethodCallParameterValidationError from "./parameter-validation-error";
import MethodCallMethodNotFoundError from "./method-not-found-error";
import MethodNotFoundError from "./method-not-found-error";
import MethodRefUnexpectedError from "./method-ref-unexpected-error";

const getExampleSchema = (): OpenRPC =>
  ({
    info: { title: "123", version: "1" },
    methods: [
      {
        name: "foo",
        params: [{ name: "foofoo", required: true, schema: { type: "string" } }],
        result: { name: "foofoo", schema: { type: "integer" } },
      },
    ],
    openrpc: "1.0.0-rc1",
  } as OpenRPC);

describe("MethodCallValidator", () => {
  it("can be instantiated", () => {
    const example = getExampleSchema();
    expect(new MethodCallValidator(example)).toBeInstanceOf(MethodCallValidator);
  });

  it("can validate a method call", () => {
    const example = getExampleSchema();
    const methodCallValidator = new MethodCallValidator(example);
    const result = methodCallValidator.validate("foo", ["foobar"]);
    expect(result).toEqual([]);
  });

  it("can handle having params empty", () => {
    const example = getExampleSchema();
    (example.methods[0] as MethodObject).params = [];
    const methodCallValidator = new MethodCallValidator(example);
    const result = methodCallValidator.validate("foo", ["foobar"]);
    expect(result).toEqual([]);
  });

  it("returns array of errors if invalid", () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const example = getExampleSchema() as any;
    const methodCallValidator = new MethodCallValidator(example);
    const result = methodCallValidator.validate("foo", [
      123,
    ]) as MethodCallParameterValidationError[];
    expect(result.length).toBe(1);
    expect(result[0]).toBeInstanceOf(MethodCallParameterValidationError);
  });

  it("can not error if param is optional", () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const example = getExampleSchema() as any;
    example.methods[0].params[0].required = false;
    const methodCallValidator = new MethodCallValidator(example);
    const result = methodCallValidator.validate("foo", []);
    expect(result).toEqual([]);
  });

  it("rpc.discover is allowed", () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const example = getExampleSchema() as any;
    const methodCallValidator = new MethodCallValidator(example);
    const result = methodCallValidator.validate("rpc.discover", []);
    expect(result).toEqual([]);
  });

  it("returns method not found error when the method name is invalid", () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const example = getExampleSchema() as any;
    const methodCallValidator = new MethodCallValidator(example);
    const result = methodCallValidator.validate("boo", ["123"]);
    expect(result).toBeInstanceOf(MethodCallMethodNotFoundError);
  });

  it("validates methods that use by-name", () => {
    const example = {
      info: { title: "123", version: "1" },
      methods: [
        {
          name: "foo",
          paramStructure: "by-name",
          params: [
            { name: "foofoo", required: true, schema: { type: "string" } },
            { name: "barbar", required: true },
          ],
          result: { name: "foofoo", schema: { type: "integer" } },
        },
      ],
      openrpc: "1.0.0-rc1",
    } as OpenrpcDocument;
    const methodCallValidator = new MethodCallValidator(example);
    const result0 = methodCallValidator.validate("foo", { foofoo: "123", barbar: "abc" });
    expect(result0).toBeInstanceOf(Array);
    expect(result0).toHaveLength(0);
    const result1 = methodCallValidator.validate("foo", { foofoo: 123, barbar: "abc" });
    expect(result1).toBeInstanceOf(Array);
    expect(result1).toHaveLength(1);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const resAsArr = result1 as any[];
    expect(resAsArr[0]).toBeInstanceOf(MethodCallParameterValidationError);
  });

  it("validates methods that use by-position", () => {
    const example = {
      info: { title: "123", version: "1" },
      methods: [
        {
          name: "foo",
          paramStructure: "by-position",
          params: [{ name: "foofoo", required: true, schema: { type: "string" } }],
          result: { name: "foofoo", schema: { type: "integer" } },
        },
      ],
      openrpc: "1.0.0-rc1",
    } as OpenrpcDocument;
    const methodCallValidator = new MethodCallValidator(example);
    const result0 = methodCallValidator.validate("foo", ["123"]);
    expect(result0).toBeInstanceOf(Array);
    expect(result0).toHaveLength(0);
    const result1 = methodCallValidator.validate("foo", [123]);
    expect(result1).toBeInstanceOf(Array);
    expect(result1).toHaveLength(1);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const resAsArr = result1 as any[];
    expect(resAsArr[0]).toBeInstanceOf(MethodCallParameterValidationError);
  });

  it("validates methods that use by-name when the param key doesnt exist", () => {
    const example = {
      info: { title: "123", version: "1" },
      methods: [
        {
          name: "foo",
          paramStructure: "by-name",
          params: [{ name: "foofoo", required: true, schema: { type: "string" } }],
          result: { name: "foofoo", schema: { type: "integer" } },
        },
      ],
      openrpc: "1.0.0-rc1",
    } as OpenrpcDocument;
    const methodCallValidator = new MethodCallValidator(example);
    const result0 = methodCallValidator.validate("foo", { barbar: "123" });
    expect(result0).toBeInstanceOf(Array);
    expect(result0).toHaveLength(1);
  });

  it("method not found errors work when the document has params passed by-name", () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const example = getExampleSchema() as any;
    const methodCallValidator = new MethodCallValidator(example);
    const result0 = methodCallValidator.validate("rawr", { barbar: "123" });
    expect(result0).toBeInstanceOf(MethodNotFoundError);
  });

  it("unexpected reference error when the document has unresolved method reference passed", () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const example = getExampleSchema() as any;
    example["x-methods"] = {
      foobar: {
        name: "foobar",
        params: [],
        result: { name: "abcfoo", schema: { type: "number" } },
      },
    };
    example.methods.push({ $ref: "#/x-methods/foobar" });
    expect(() => new MethodCallValidator(example)).toThrowError(MethodRefUnexpectedError);
  });
});
