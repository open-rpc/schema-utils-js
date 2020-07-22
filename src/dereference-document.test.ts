import * as _fs from "fs-extra";
import makeDereferenceDocument, { OpenRPCDocumentDereferencingError } from "./dereference-document";
import { OpenrpcDocument, ContentDescriptorObject, JSONSchema } from "@open-rpc/meta-schema";
import { JSONSchemaObject } from "@json-schema-tools/meta-schema";

const dereferenceDocument = makeDereferenceDocument();

const workingDocument: OpenrpcDocument = {
  info: {
    title: "foo",
    version: "1",
  },
  methods: [],
  openrpc: "1.0.0-rc1",
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
    expect(((document.methods[0].result as ContentDescriptorObject).schema as JSONSchemaObject).title).toBe("bigOlFoo");
  });

  it("interdependent refs", async () => {
    expect.assertions(12);
    const testDoc = {
      openrpc: "1.0.0-rc1",
      info: {
        title: "foo",
        version: "1",
      },
      methods: [
        {
          name: "foo",
          params: [
            { $ref: "#/components/contentDescriptors/bazerino" },
            { name: "leFoo", schema: { $ref: "#/components/schemas/fatFoo" } }
          ],
          result: {
            name: "fooResult",
            schema: { $ref: "#/components/schemas/bigBar" }
          }
        }
      ],
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
    } as OpenrpcDocument;

    const document = await dereferenceDocument(testDoc);
    expect(document.methods).toBeDefined();
    expect(document.methods[0]).toBeDefined();

    const params = document.methods[0].params as ContentDescriptorObject[];
    const result = document.methods[0].result as ContentDescriptorObject;
    expect(params).toBeDefined();
    expect(result).toBeDefined();

    const param0 = params[0] as ContentDescriptorObject;
    const param1 = params[1] as ContentDescriptorObject;

    expect(param0.name).toBe("bazerino");
    expect((param0.schema as JSONSchemaObject).title).toBe("badBaz");
    expect(param1.name).toBe("leFoo");
    expect((param1.schema as JSONSchemaObject).title).toBe("fatFoo");
    expect((result.schema as JSONSchemaObject).title).toBe("bigBar");
    const resultProps = (result.schema as JSONSchemaObject).properties as { [k: string]: JSONSchema };

    expect(resultProps).toBeDefined();
    expect((resultProps.fatFoo as JSONSchemaObject).title).toBe("fatFoo");
    expect((resultProps.badBaz as JSONSchemaObject).title).toBe("badBaz");
  });


  it("throws when a json pointer is invalid", () => {
    const testDoc = {
      openrpc: "1.2.4",
      info: {
        title: "foo",
        version: "1",
      },
      methods: [
        {
          name: "foo",
          params: [],
          result: {
            $ref: " "
          }
        }
      ],
    };


    return expect(dereferenceDocument(testDoc as OpenrpcDocument))
      .rejects
      .toBeInstanceOf(OpenRPCDocumentDereferencingError);
  });

  it("throws when a json pointer points to something that doesnt exist", () => {
    const testDoc = {
      openrpc: "1.2.4",
      info: {
        title: "foo",
        version: "1",
      },
      methods: [
        {
          name: "foo",
          params: [],
          result: {
            $ref: "#/doesnt/exists"
          }
        }
      ],
    };


    return expect(dereferenceDocument(testDoc as OpenrpcDocument))
      .rejects
      .toBeInstanceOf(OpenRPCDocumentDereferencingError);
  });

  it("it works with boolean schemas & links", async () => {
    const testDoc = {
      openrpc: "1.2.4",
      info: {
        title: "foo",
        version: "1",
      },
      methods: [
        {
          name: "foo",
          params: [],
          result: {
            name: "fooResult",
            schema: true
          },
          links: [{ $ref: "#/components/links/fooLink" }]
        }
      ],
      components: {
        methods: {
          notUsed: { name: "notUsed", params: [], result: { name: "unused", schema: true } }
        },
        links: {
          fooLink: {
            name: "fooLink"
          }
        }
      }
    };

    const result = await dereferenceDocument(testDoc as OpenrpcDocument) as any;

    expect(result.methods[0].links[0]).toBe(testDoc.components.links.fooLink)

    return expect(dereferenceDocument(testDoc as OpenrpcDocument))
      .resolves
      .toEqual(testDoc);
  });

});
