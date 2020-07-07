import * as _fs from "fs-extra";
import makeDereferenceDocument from "./dereference-document";
import { OpenrpcDocument, ContentDescriptorObject } from "@open-rpc/meta-schema";

const dereferenceDocument = makeDereferenceDocument();
const fs: any = _fs;

const workingDocument: OpenrpcDocument = {
  info: {
    title: "foo",
    version: "1",
  },
  methods: [],
  openrpc: "1.0.0-rc1",
};

const badRefDocument: OpenrpcDocument = {
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

describe("dereferenceDocument", () => {

  it("doesnt explode", async () => {
    expect.assertions(1);
    const document = await dereferenceDocument(workingDocument);
    expect(document.methods).toBeDefined();
  });

  it("derefs simple stuff", async () => {
    expect.assertions(6);
    const testDoc = {
      ...workingDocument,
      components: {
        schemas: {
          bigOlFoo: { title: "bigOlFoo", type: "string" }
        },
        contentDescriptors: {
          bazerino: {
            name: "bazerino",
            schema: { title: "bigBazerino", type: "number" }
          }
        }
      }
    };
    testDoc.methods.push({
      name: "foo",
      params: [{ $ref: "#/components/contentDescriptors/bazerino" }],
      result: {
        name: "fooResult",
        schema: { $ref: "#/components/schemas/bigOlFoo" }
      }
    });

    const document = await dereferenceDocument(testDoc);
    expect(document.methods).toBeDefined();
    expect(document.methods[0]).toBeDefined();
    expect(document.methods[0].params[0]).toBeDefined();
    expect((document.methods[0].params[0] as ContentDescriptorObject).name).toBe("bazerino");
    expect(document.methods[0].result).toBeDefined();
    expect((document.methods[0].result as ContentDescriptorObject).schema.title).toBe("bigOlFoo");
  });
});
