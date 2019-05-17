jest.mock("fs-extra", () => ({
  pathExists: jest.fn(),
  readJson: jest.fn(),
}));

import * as _fs from "fs-extra";
import parseOpenRPCDocument, { OpenRPCDocumentDereferencingError } from "./parse-open-rpc-document";
import { OpenRPC } from "@open-rpc/meta-schema";
import { OpenRPCDocumentValidationError } from "./validate-open-rpc-document";

const fs: any = _fs;

const workingDocument: OpenRPC = {
  info: {
    title: "foo",
    version: "1",
  },
  methods: [],
  openrpc: "1.0.0-rc1",
};

const badRefDocument: OpenRPC = {
  ...workingDocument,
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
};
const invalidDocument: OpenRPC = {
  ...workingDocument,
  methods: [
    {
      name: "foo",
      params: [
        {
          name: "bar",
          schema: { type: "string" },
        },
      ],
      result: {
        name: "baz",
        schema: { type: "boolean" },
      },
      zfloobars: 123,
    },
  ],
};

describe("parseOpenRPCDocument", () => {

  beforeEach(() => {
    fs.readJson.mockResolvedValue(workingDocument);
  });

  it("defaults to looking for openrc.json in cwd", async () => {
    expect.assertions(1);
    await parseOpenRPCDocument();
    expect(fs.readJson).toHaveBeenCalledWith(`./openrpc.json`);
  });

  it("handles custom file path", async () => {
    expect.assertions(1);
    const document = await parseOpenRPCDocument(
      "./node_modules/@open-rpc/examples/service-descriptions/petstore.json",
    );
    expect(document.methods).toBeDefined();
  });

  it("handles urls", async () => {
    const url = "https://raw.githubusercontent.com/open-rpc/examples/master/service-descriptions/petstore-openrpc.json";
    const document = await parseOpenRPCDocument(url);
    expect(document.methods).toBeDefined();
  });

  it("handles json as string", async () => {
    const document = await parseOpenRPCDocument(JSON.stringify(workingDocument));
    expect(document.methods).toBeDefined();
  });

  it("handles being passed an open rpc object", async () => {
    const document = await parseOpenRPCDocument(workingDocument);
    expect(document.methods).toBeDefined();
  });

  it("can disable validation", async () => {
    const document = await parseOpenRPCDocument(invalidDocument, { validate: false });
    expect(document.methods).toBeDefined();
  });

  it("can disable derefing", async () => {
    const document = await parseOpenRPCDocument(badRefDocument, { dereference: false });
    expect(document.methods).toBeDefined();
  });

  describe("errors", () => {
    it("rejects when unable to find file via default", () => {
      expect.assertions(1);
      fs.readJson.mockClear();
      fs.readJson.mockRejectedValue(new Error("cannot compute error"));
      return expect(parseOpenRPCDocument())
        .rejects
        .toThrow("Unable to read openrpc.json file located at ./openrpc.json");
    });

    it("rejects when unable to find file via custom path", () => {
      expect.assertions(1);
      fs.readJson.mockClear();
      fs.readJson.mockRejectedValue(new Error("cannot compute error"));
      return expect(parseOpenRPCDocument("./not/a/real/path.json"))
        .rejects
        .toThrow("Unable to read");
    });

    it("rejects when the url doesnt resolve to a schema", () => {
      expect.assertions(1);
      fs.readJson.mockClear();
      fs.readJson.mockRejectedValue(new Error("cannot compute error"));
      return expect(parseOpenRPCDocument("https://google.com"))
        .rejects
        .toThrow("Unable to download");
    });

    it("rejects when the schema cannot be dereferenced", () => {
      expect.assertions(1);

      return expect(parseOpenRPCDocument(badRefDocument))
        .rejects
        .toBeInstanceOf(OpenRPCDocumentDereferencingError);
    });

    it("rejects when the schema is invalid", () => {
      expect.assertions(1);
      return expect(parseOpenRPCDocument(invalidDocument))
        .rejects
        .toBeInstanceOf(OpenRPCDocumentValidationError);
    });

    it("rejects when the json provided is invalid from file", () => {
      expect.assertions(1);
      fs.readJson.mockClear();
      fs.readJson.mockRejectedValue(new Error("SyntaxError: super duper bad one"));
      const file = "./node_modules/@open-rpc/examples/service-descriptions/petstore-openrpc.json";
      return expect(parseOpenRPCDocument(file)).rejects.toThrow();
    });
  });
});
