import * as _fs from "fs-extra";
import makeDereferenceDocument from "./dereference-document";
import { OpenrpcDocument, ContentDescriptorObject, JSONSchema } from "@open-rpc/meta-schema";

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

  it("interdependent refs", async () => {
    expect.assertions(12);
    const testDoc = {
      ...workingDocument,
      components: {
        schemas: {
          fatFoo: { title: "fatFoo", type: "string" },
          bigBar: {
            title: "bigBar",
            type: "object",
            properties: {
              fatFoo: { $ref: "#/components/schemas/fatFoo" },
              badBaz: { $ref: "#/components/schemas/badBaz" }
            }
          },
          badBaz: { title: "badBaz", type: "number" }
        },
        contentDescriptors: {
          bazerino: {
            name: "bazerino",
            schema: { $ref: "#/components/schemas/badBaz" }
          }
        }
      }
    };
    testDoc.methods.push({
      name: "foo",
      params: [
        { $ref: "#/components/contentDescriptors/bazerino" },
        { name: "leFoo", schema: { $ref: "#/components/schemas/fatFoo" } }
      ],
      result: {
        name: "fooResult",
        schema: { $ref: "#/components/schemas/bigBar" }
      }
    });

    const document = await dereferenceDocument(testDoc);
    expect(document.methods).toBeDefined();
    expect(document.methods[0]).toBeDefined();

    const params = document.methods[0].params as ContentDescriptorObject[];
    const result = document.methods[0].result as ContentDescriptorObject;
    expect(params).toBeDefined();
    expect(result).toBeDefined();


    expect(params[0].name).toBe("bazerino");
    expect(params[0].schema.title).toBe("badBaz");
    expect(params[1].name).toBe("leFoo");
    expect(params[1].schema.title).toBe("fatFoo");
    expect(result.schema.title).toBe("bigBar");
    const resultProps = result.schema.properties as { [k: string]: JSONSchema };

    expect(resultProps).toBeDefined();
    expect(resultProps.fatFoo.title).toBe("fatFoo");
    expect(resultProps.badBaz.title).toBe("badbaz");
  });
});
