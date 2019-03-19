import { makeIdForMethodContentDescriptors } from "./make-id-for-method-content-descriptors";
import { types } from "@open-rpc/meta-schema";

describe("makeIdForMethodContentDescriptors", () => {
  it("returns an id", () => {
    const method = {
      name: "foo",
      params: [{ name: "bar" }],
      result: { name: "baz" },
    };
    const result = makeIdForMethodContentDescriptors(method, method.params[0]);
    expect(result).toBe("foo/0");
  });

  it("throws if there are no params on the method", () => {
    const method = {
      name: "foo",
      result: { name: "baz" },
    };
    expect(() => makeIdForMethodContentDescriptors(method, { name: "123" }))
      .toThrow("Content Descriptor not found in method.");
  });

  it("works when the method paramStructure is by-name", () => {
    const method = {
      name: "foo",
      paramStructure: "by-name",
      params: [{ name: "bar" }],
      result: { name: "baz" },
    } as types.MethodObject;

    expect(makeIdForMethodContentDescriptors(method, { name: "123" })).toBe("foo/123");
  });

  it("throws when the content descriptor is not found in the params", () => {
    const method = {
      name: "foo",
      params: [{ name: "u will never get dis" }],
      result: { name: "baz" },
    } as types.MethodObject;

    expect(() => makeIdForMethodContentDescriptors(method, { name: "123" }))
      .toThrow("Content Descriptor not found in method.");
  });
});
