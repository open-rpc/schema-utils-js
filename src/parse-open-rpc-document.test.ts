jest.mock("fs-extra", () => ({
  pathExists: jest.fn(),
  readJson: jest.fn(),
}));

import * as _fs from "fs-extra";
import makeParseOpenRPCDocument, { makeCustomResolver } from "./parse-open-rpc-document";
import { OpenrpcDocument as OpenRPC, OpenrpcDocument } from "@open-rpc/meta-schema";
import { OpenRPCDocumentValidationError } from "./validate-open-rpc-document";
import fetchUrlSchema from "./get-open-rpc-document-from-url";
import readSchemaFromFile from "./get-open-rpc-document-from-file";
import { OpenRPCDocumentDereferencingError } from "./dereference-document";
import { JSONSchema } from "@json-schema-tools/meta-schema";

const parseOpenRPCDocument = makeParseOpenRPCDocument(fetchUrlSchema, readSchemaFromFile);
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const fs: any = _fs;

const workingDocument: OpenRPC = {
  info: {
    title: "foo",
    version: "1",
  },
  methods: [],
  openrpc: "1.0.0-rc1",
};

const notificationDocument: OpenRPC = {
  ...workingDocument,
  methods: [
    {
      name: "foo",
      params: [
        {
          name: "bar",
          schema: { type: "boolean" },
        },
      ],
      examples: [
        {
          name: "example",
          params: [
            {
              name: "bar",
              value: true,
            },
          ],
        },
      ],
    },
  ],
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
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const invalidDocument: any = {
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
      "./node_modules/@open-rpc/examples/service-descriptions/petstore.json"
    );
    expect(document.methods).toBeDefined();
  });

  it("handles urls", async () => {
    expect.assertions(1);
    const url =
      "https://raw.githubusercontent.com/open-rpc/examples/master/service-descriptions/petstore-openrpc.json";
    const document = await parseOpenRPCDocument(url);
    expect(document.methods).toBeDefined();
  });

  it("handles json as string", async () => {
    expect.assertions(1);
    const document = await parseOpenRPCDocument(JSON.stringify(workingDocument));
    expect(document.methods).toBeDefined();
  });

  it("handles being passed an open rpc object", async () => {
    expect.assertions(1);
    const document = await parseOpenRPCDocument(workingDocument);
    expect(document.methods).toBeDefined();
  });

  it("handles being passed an open rpc object with notification", async () => {
    expect.assertions(1);
    const document = await parseOpenRPCDocument(notificationDocument);
    expect(document.methods).toBeDefined();
  });

  it("can disable validation", async () => {
    expect.assertions(1);
    const document = await parseOpenRPCDocument(invalidDocument, { validate: false });
    expect(document.methods).toBeDefined();
  });

  it("can disable derefing", async () => {
    expect.assertions(1);
    const document = await parseOpenRPCDocument(badRefDocument, { dereference: false });
    expect(document.methods).toBeDefined();
  });

  describe("errors", () => {
    it("rejects when unable to find file via default", async () => {
      expect.assertions(1);
      fs.readJson.mockClear();
      fs.readJson.mockRejectedValue(new Error("cannot compute error"));
      try {
        await parseOpenRPCDocument();
      } catch (e) {
        expect(e).toBeDefined();
      }
    });

    it("rejects when unable to find file via custom path", async () => {
      expect.assertions(1);
      fs.readJson.mockClear();
      fs.readJson.mockRejectedValue(new Error("cannot compute error"));
      try {
        await parseOpenRPCDocument("./not/a/real/path.json");
      } catch (e) {
        expect(e).toBeDefined();
      }
    });

    it("rejects when the url doesnt resolve to a schema", async () => {
      expect.assertions(1);
      fs.readJson.mockClear();
      fs.readJson.mockRejectedValue(new Error("cannot compute error"));
      try {
        await parseOpenRPCDocument("https://google.com");
      } catch (e) {
        expect(e).toBeDefined();
      }
    });

    it("rejects when the schema cannot be dereferenced", async () => {
      expect.assertions(1);
      fs.readJson.mockClear();
      try {
        await parseOpenRPCDocument(badRefDocument);
      } catch (e) {
        expect(e).toBeInstanceOf(OpenRPCDocumentDereferencingError);
      }
    });

    it("rejects when the schema is invalid", async () => {
      expect.assertions(1);
      fs.readJson.mockClear();
      try {
        await parseOpenRPCDocument(invalidDocument);
      } catch (e) {
        expect(e).toBeInstanceOf(OpenRPCDocumentValidationError);
      }
    });

    it("throws when the schema becomes invalid after dereffing", async () => {
      expect.assertions(2);
      fs.readJson.mockClear();
      const doc = {
        openrpc: "1.2.1",
        info: {
          version: "1",
          title: "test",
        },
        methods: [
          {
            name: "buildHelicopter",
            params: [{ $ref: "#/components/contentDescriptors/NumBlades" }],
            result: {
              name: "helicopterrr",
              schema: { $ref: `${__dirname}/bad-schema.json` },
            },
          },
        ],
        components: {
          contentDescriptors: {
            NumBlades: {
              name: "NumBlades",
              required: true,
              schema: { title: "NumBlades", type: "string" },
            },
          },
        },
      } as OpenrpcDocument;

      let result;
      try {
        result = await parseOpenRPCDocument(doc);
      } catch (e) {
        expect(e).toBeInstanceOf(OpenRPCDocumentValidationError);
        expect(result).toBeUndefined();
      }
    });

    it("when dereffing a schema pointing at a content descriptor", async () => {
      expect.assertions(1);
      fs.readJson.mockClear();
      try {
        await parseOpenRPCDocument({
          openrpc: "1.2.1",
          info: {
            version: "1",
            title: "test",
          },
          methods: [
            {
              name: "foo",
              params: [{ $ref: "#/components/contentDescriptors/LeFoo" }],
              result: {
                name: "bar",
                schema: { $ref: "#/components/contentDescriptors/LeFoo" },
              },
            },
          ],
          components: {
            schemas: {
              LeBar: { title: "LeBar", type: "string" },
            },
            contentDescriptors: {
              LeFoo: {
                name: "LeFoo",
                required: true,
                schema: { $ref: "#/components/schemas/LeBar" },
              },
            },
          },
        });
      } catch (e) {
        expect(e).toBeInstanceOf(OpenRPCDocumentDereferencingError);
      }
    });

    it("should make a reference resolver", () => {
      const resolver = makeCustomResolver({
        file: async (): Promise<JSONSchema> => {
          return {};
        },
      });
      expect(resolver).toBeDefined();
    });

    it("should handle dereference option true", async () => {
      const document = await parseOpenRPCDocument(workingDocument, {
        dereference: true,
      });
      expect(document.methods).toBeDefined();
    });

    it("should handle custom resolver option", async () => {
      const resolver = makeCustomResolver({
        handler: async (_uri: string): Promise<JSONSchema> => {
          return {};
        },
      });
      const document = await parseOpenRPCDocument(workingDocument, {
        resolver,
      });
      expect(document.methods).toBeDefined();
    });

    it("rejects when the json provided is invalid from file", async () => {
      expect.assertions(1);
      fs.readJson.mockClear();
      fs.readJson.mockRejectedValue(new Error("SyntaxError: super duper bad one"));
      const file = "./node_modules/@open-rpc/examples/service-descriptions/petstore-openrpc.json";
      try {
        await parseOpenRPCDocument(file);
      } catch (e) {
        expect(e).toBeDefined();
      }
    });
  });
});
