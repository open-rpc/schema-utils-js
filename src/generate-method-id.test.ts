import { generateMethodParamId, generateMethodResultId } from "./generate-method-id";
import { types } from "@open-rpc/meta-schema";

describe("methodParamId", () => {
  it("returns an id for params", () => {
    const method = {
      name: "foo",
      params: [{ name: "bar" }],
      result: { name: "baz" },
    };
    const result = generateMethodParamId(method, method.params[0]);
    expect(result).toBe("foo/0");
  });

  it("index by name when the method paramStructure is by-name", () => {
    const method = {
      name: "foo",
      paramStructure: "by-name",
      params: [{ name: "bar" }],
      result: { name: "baz" },
    } as types.MethodObject;

    expect(generateMethodParamId(method, { name: "bar" })).toBe("foo/bar");
  });

  describe("throws when the content descriptor is not found in the params", () => {
    it("by-position", () => {
      const method = {
        name: "foo",
        params: [{ name: "u will never get dis" }],
        result: { name: "baz" },
      } as types.MethodObject;

      expect(() => generateMethodParamId(method, { name: "123" }))
        .toThrow("Content Descriptor not found in method.");
    });

    it("by-name", () => {
      const method = {
        name: "foo",
        paramStructure: "by-name",
        params: [{ name: "bar" }],
        result: { name: "baz" },
      } as types.MethodObject;

      expect(() => generateMethodParamId(method, { name: "123" })).toThrow();
    });
  });
});

describe("methodResultId", () => {
  it("returns an id for result", () => {
    const method = {
      name: "foo",
      params: [{ name: "bar" }],
      result: { name: "baz" },
    };
    const result = generateMethodResultId(method, method.result);
    expect(result).toBe("foo/result");
  });
});
