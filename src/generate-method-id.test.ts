import { generateMethodParamId, generateMethodResultId } from "./generate-method-id";
import { MethodObject } from "@open-rpc/meta-schema";

describe("methodParamId", () => {
  it("returns an id for params", () => {
    const method = {
      name: "foo",
      params: [{ name: "bar", schema: {} }],
      result: { name: "baz", schema: {} },
    };
    const result = generateMethodParamId(method, method.params[0]);
    expect(result).toBe("foo/0");
  });

  it("index by name when the method paramStructure is by-name", () => {
    const method = {
      name: "foo",
      paramStructure: "by-name",
      params: [{ name: "bar", schema: {} }],
      result: { name: "baz", schema: {} },
    } as MethodObject;

    expect(generateMethodParamId(method, { name: "bar", schema: {} })).toBe("foo/bar");
  });

  describe("throws when the content descriptor is not found in the params", () => {
    it("by-position", () => {
      const method = {
        name: "foo",
        params: [{ name: "u will never get dis", schema: {} }],
        result: { name: "baz", schema: {} },
      } as MethodObject;

      expect(() => generateMethodParamId(method, { name: "123", schema: {} }))
        .toThrow("Content Descriptor not found in method.");
    });

    it("by-name", () => {
      const method = {
        name: "foo",
        paramStructure: "by-name",
        params: [{ name: "bar", schema: {} }],
        result: { name: "baz", schema: {} },
      } as MethodObject;

      expect(() => generateMethodParamId(method, { name: "123", schema: {} })).toThrow();
    });
  });
});

describe("methodResultId", () => {
  it("returns an id for result", () => {
    const method = {
      name: "foo",
      params: [{ name: "bar", schema: {} }],
      result: { name: "baz", schema: {} },
    };
    const result = generateMethodResultId(method, method.result);
    expect(result).toBe("foo/result");
  });

  it("throws when the result doesnt match the methods result", () => {
    const method = {
      name: "foo",
      params: [],
      result: { name: "baz", schema: {} },
    };

    expect(() => generateMethodResultId(method, { name: "peepee", schema: {} }))
      .toThrow("Content Descriptor not found in method.");
  });
});
