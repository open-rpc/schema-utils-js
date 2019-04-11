jest.mock("fs-extra", () => ({
  pathExists: jest.fn(),
  readJson: jest.fn(),
}));

import * as _fs from "fs-extra";
import { parse } from "./parse";
import { types } from "@open-rpc/meta-schema";

const fs: any = _fs;

const workingSchema: types.OpenRPC = {
  info: {
    title: "foo",
    version: "1",
  },
  methods: [],
  openrpc: "1.0.0-rc1",
};

describe("get-schema", () => {

  beforeEach(() => {
    fs.readJson.mockResolvedValue(workingSchema);
  });

  it("defaults to looking for openrc.json in cwd", async () => {
    expect.assertions(1);
    const schema = await parse();
    expect(fs.readJson).toHaveBeenCalledWith(`${process.cwd()}/openrpc.json`);
  });

  it("handles custom file path", async () => {
    expect.assertions(1);
    const schema: any = await parse("./node_modules/@open-rpc/examples/service-descriptions/petstore.json");
    expect(schema.methods).toBeDefined();
  });

  it("handles urls", async () => {
    const url = "https://raw.githubusercontent.com/open-rpc/examples/master/service-descriptions/petstore-openrpc.json";
    const schema: any = await parse(url);
    expect(schema.methods).toBeDefined();
  });

  it("handles json as string", async () => {
    const schema: any = await parse(JSON.stringify(workingSchema));
    expect(schema.methods).toBeDefined();
  });

  it("handles being passed an open rpc object", async () => {
    const schema: any = await parse(workingSchema);
    expect(schema.methods).toBeDefined();
  });

  describe("errors", () => {
    it("rejects when unable to find file via default", () => {
      expect.assertions(1);
      fs.readJson.mockClear();
      fs.readJson.mockRejectedValue(new Error("cannot compute error"));
      return expect(parse()).rejects.toThrow("Unable to read");
    });

    it("rejects when unable to find file via custom path", () => {
      expect.assertions(1);
      fs.readJson.mockClear();
      fs.readJson.mockRejectedValue(new Error("cannot compute error"));
      return expect(parse("./not/a/real/path.json")).rejects.toThrow("Unable to read");
    });

    it("rejects when the url doesnt resolve to a schema", () => {
      expect.assertions(1);
      fs.readJson.mockClear();
      fs.readJson.mockRejectedValue(new Error("cannot compute error"));
      return expect(parse("https://google.com")).rejects.toThrow("Unable to download");
    });

    it("rejects when the schema cannot be dereferenced", () => {
      expect.assertions(1);
      fs.readJson.mockClear();
      fs.readJson.mockResolvedValue({
        ...workingSchema,
        methods: [
          {
            name: "foo",
            params: [
              {
                name: "bar",
                schema: { $ref: "#/components/bar" },
              },
            ],
            result: {
              name: "baz",
              schema: { $ref: "#/noponents/bazaaaooow" },
            },
          },
        ],
      });
      return expect(parse()).rejects.toThrow("The json schema provided cannot be dereferenced");
    });

    it("rejects when the schema is invalid", () => {
      expect.assertions(1);
      fs.readJson.mockClear();
      fs.readJson.mockResolvedValue({
        ...workingSchema,
        methods: [
          {
            name: "foo",
            params: [
              {
                name: "bar",
                schema: { $ref: "#/components/bar" },
              },
            ],
            result: {
              name: "baz",
              schema: { $ref: "#/noponents/bazaaaooow" },
            },
            zfloobars: 123,
          },
        ],
      });
      return expect(parse()).rejects.toThrow(/Error Validating schema against meta-schema/);
    });

    it("rejects when the json provided is invalid from file", () => {
      expect.assertions(1);
      fs.readJson.mockClear();
      fs.readJson.mockRejectedValue(new Error("SyntaxError: super duper bad one"));
      const file = "./node_modules/@open-rpc/examples/service-descriptions/petstore-openrpc.json";
      return expect(parse(file)).rejects.toThrow();
    });
  });
});
