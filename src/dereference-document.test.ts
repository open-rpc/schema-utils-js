import * as _fs from "fs-extra";
import dereferenceDocument, {
  OpenRPCDocumentDereferencingError,
} from "./dereference-document";
import defaultResolver from "@json-schema-tools/reference-resolver";
import {
  OpenrpcDocument,
  ContentDescriptorObject,
  JSONSchema,
  MethodObject,
} from "@open-rpc/meta-schema";
import { JSONSchemaObject } from "@json-schema-tools/meta-schema";
import { JSONSchema7 } from "json-schema";

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

  it("simple case", async () => {
    expect.assertions(1);
    const document = await dereferenceDocument({
      info: {
        title: "foo",
        version: "1",
      },
      methods: [
        {
          name: "abc",
          params: [],
          result: { name: "cba", schema: { type: "number" } },
        },
      ],
      openrpc: "1.0.0-rc1",
    });
    expect(document.methods).toBeDefined();
  });

  it("derefs simple stuff", async () => {
    expect.assertions(7);
    const testDoc = {
      ...workingDocument,
      "x-methods": {
        foobar: {
          name: "foobar",
          params: [],
          result: {
            name: "abcfoo",
            schema: { type: "number" },
          },
        },
      },
      components: {
        schemas: {
          bigOlBaz: { $ref: "#/components/schemas/bigOlFoo" },
          bigOlFoo: { title: "bigOlFoo", type: "string" },
        },
        contentDescriptors: {
          bazerino: {
            name: "bazerino",
            schema: { title: "bigBazerino", type: "number" },
          },
          barf: {
            name: "barf",
            schema: { $ref: "#/components/schemas/bigOlFoo" },
          },
        },
        tags: {
          foobydooby: { name: "foobydooby" },
        },
        errors: {
          bigBadError: { code: 123, message: "123" },
        },
        examples: {
          abcEx: { name: "abcEx", value: [123, 321] },
          cbaEx: { name: "cbaEx", value: "abc" },
        },
        examplePairingObjects: {
          testy: {
            name: "testy",
            params: [{ $ref: "#/components/examples/abcEx" }],
            result: { $ref: "#/components/examples/cbaEx" },
          },
        },
      },
    };
    testDoc.methods.push({
      tags: [{ $ref: "#/components/tags/foobydooby" }],
      errors: [{ $ref: "#/components/errors/bigBadError" }],
      examples: [{ $ref: "#/components/examplePairingObjects/testy" }],
      name: "foo",
      params: [
        { $ref: "#/components/contentDescriptors/bazerino" },
        {
          name: "blah blah",
          schema: { $ref: "#/components/schemas/bigOlBaz" },
        },
        { $ref: "#/components/contentDescriptors/barf" },
      ],
      result: {
        name: "fooResult",
        schema: { $ref: "#/components/schemas/bigOlFoo" },
      },
    });
    testDoc.methods.push({ $ref: "#/x-methods/foobar" });

    const document = await dereferenceDocument(testDoc);
    const docMethods = document.methods as MethodObject[];
    expect(docMethods).toBeDefined();
    expect(docMethods[0]).toBeDefined();
    expect(docMethods[0].params[0]).toBeDefined();
    expect((docMethods[0].params[0] as ContentDescriptorObject).name).toBe(
      "bazerino"
    );
    expect(docMethods[0].result).toBeDefined();
    expect(
      (
        (docMethods[0].result as ContentDescriptorObject)
          .schema as JSONSchemaObject
      ).title
    ).toBe("bigOlFoo");
    expect(
      (
        (docMethods[0].params as ContentDescriptorObject[])[1]
          .schema as JSONSchemaObject
      ).title
    ).toBe("bigOlFoo");
  });

  it("derefs items", async () => {
    expect.assertions(3);
    const testDoc = {
      openrpc: "1.2.4",
      info: {
        title: "Test ref",
        version: "1.0.0",
      },
      methods: [
        {
          name: "wallet_createSession",
          paramStructure: "by-name",
          params: [
          ],
          result: {
            name: "wallet_createSessionResult",
            schema: {
              type: "object",
              properties: {
                sessionScopes: {
                  $ref: "#/components/schemas/SessionScopes",
                },
              },
            },
          },
          examples: [
          ],
          errors: []
        },
      ],
      components: {
        schemas: {
          SessionScopes: {
            type: "object",
            patternProperties: {
              "[-a-z0-9]{3,8}(:[-_a-zA-Z0-9]{1,32})?": {
                $ref: "#/components/schemas/Scope",
              },
            },
          },
          ScopeString: {
            type: "string",
            pattern: "[-a-z0-9]{3,8}(:[-_a-zA-Z0-9]{1,32})?",
          },
          Scope: {
            type: "object",
            title: "Scope",
            description: "Scope for a multi-chain connection",
            additionalProperties: true,
            required: ["notifications", "methods"],
            properties: {
              scopes: {
                type: "array",
                items: {
                  $ref: "#/components/schemas/ScopeString",
                },
              },
              methods: {
                description:
                  "Methods that the wallet must support in order to be used with this provider.",
                type: "array",
                items: {
                  type: "string",
                },
              },
              notifications: {
                description:
                  "Notifications that the wallet must support in order to be used with this provider.",
                type: "array",
                items: {
                  type: "string",
                },
              },
              rpcEndpoints: {
                description: "JSON-RPC endpoints for this namespace.",
                type: "array",
                items: {
                  type: "string",
                  format: "uri",
                },
              },
              rpcDocuments: {
                type: "array",
                description:
                  "OpenRPC documents that define RPC methods in which to anchor the methods authorized in a CAIP-25 interaction.",
                items: {
                  type: "string",
                  format: "uri",
                },
              },
            },
          },
        },
      },
    };

    const document = await dereferenceDocument(testDoc as OpenrpcDocument);
    const docMethods = document.methods as MethodObject[];
    expect(docMethods).toBeDefined();
    expect(docMethods[0]).toBeDefined();
    expect(
      () => {
        JSON.stringify(document)
      }
    ).not.toThrow();
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
            { name: "leFoo", schema: { $ref: "#/components/schemas/fatFoo" } },
          ],
          result: {
            name: "fooResult",
            schema: { $ref: "#/components/schemas/bigBar" },
          },
        },
      ],
      components: {
        schemas: {
          fatFoo: { title: "fatFoo", type: "string" },
          bigBar: {
            title: "bigBar",
            type: "object",
            properties: {
              fatFoo: { $ref: "#/components/schemas/fatFoo" },
              badBaz: { $ref: "#/components/schemas/badBaz" },
            },
          },
          badBaz: { title: "badBaz", type: "number" },
        },
        contentDescriptors: {
          bazerino: {
            name: "bazerino",
            schema: { $ref: "#/components/schemas/badBaz" },
          },
        },
      },
    } as OpenrpcDocument;

    const document = await dereferenceDocument(testDoc);
    expect(document.methods).toBeDefined();
    expect(document.methods[0]).toBeDefined();

    const params = (document.methods[0] as MethodObject)
      .params as ContentDescriptorObject[];
    const result = (document.methods[0] as MethodObject)
      .result as ContentDescriptorObject;
    expect(params).toBeDefined();
    expect(result).toBeDefined();

    const param0 = params[0] as ContentDescriptorObject;
    const param1 = params[1] as ContentDescriptorObject;

    expect(param0.name).toBe("bazerino");
    expect((param0.schema as JSONSchemaObject).title).toBe("badBaz");
    expect(param1.name).toBe("leFoo");
    expect((param1.schema as JSONSchemaObject).title).toBe("fatFoo");
    expect((result.schema as JSONSchemaObject).title).toBe("bigBar");
    const resultProps = (result.schema as JSONSchemaObject).properties as {
      [k: string]: JSONSchema;
    };

    expect(resultProps).toBeDefined();
    expect((resultProps.fatFoo as JSONSchemaObject).title).toBe("fatFoo");
    expect((resultProps.badBaz as JSONSchemaObject).title).toBe("badBaz");
  });

  it("throws when a json pointer is invalid", async () => {
    expect.assertions(1);

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
            $ref: " ",
          },
        },
      ],
    };

    try {
      await dereferenceDocument(testDoc as OpenrpcDocument);
    } catch (e) {
      expect(e).toBeInstanceOf(OpenRPCDocumentDereferencingError);
    }
  });

  it("throws when a json pointer points to something that doesnt exist", async () => {
    expect.assertions(1);

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
            $ref: "#/doesnt/exists",
          },
        },
      ],
    };

    try {
      await dereferenceDocument(testDoc as OpenrpcDocument);
    } catch (e) {
      expect(e).toBeInstanceOf(OpenRPCDocumentDereferencingError);
    }
  });

  it("throws when a json pointer points to something that doesnt exist inside of schema components", async () => {
    expect.assertions(1);

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
          result: { name: "foobar", schema: true },
        },
      ],
      components: {
        schemas: {
          foo: { $ref: "#/abc123" },
        },
      },
    };

    try {
      await dereferenceDocument(testDoc as OpenrpcDocument);
    } catch (e) {
      expect(e).toBeInstanceOf(OpenRPCDocumentDereferencingError);
    }
  });

  it("works with boolean schemas & links", async () => {
    expect.assertions(1);

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
            schema: true,
          },
          links: [{ $ref: "#/components/links/fooLink" }],
        },
      ],
      components: {
        methods: {
          notUsed: {
            name: "notUsed",
            params: [],
            result: { name: "unused", schema: true },
          },
        },
        links: {
          fooLink: {
            name: "fooLink",
          },
        },
      },
    };

    const result = (await dereferenceDocument(
      testDoc as OpenrpcDocument
    )) as any;

    expect(result.methods[0].links[0]).toBe(testDoc.components.links.fooLink);
  });

  it("works with ref to a file", async () => {
    expect.assertions(1);

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
            schema: { $ref: `${__dirname}/good-schema.json` },
          },
        },
      ],
    };

    const result = (await dereferenceDocument(
      testDoc as OpenrpcDocument
    )) as any;

    expect(result.methods[0].result.schema.type).toBe("string");
  });

  it("works with schema that makes ref to a schema from components", async () => {
    expect.assertions(1);

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
            schema: {
              type: "object",
              properties: {
                foo: { $ref: "#/components/schemas/foo" },
              },
            },
          },
        },
      ],
      components: {
        schemas: {
          foo: { type: "string" },
        },
      },
    };

    const result = (await dereferenceDocument(
      testDoc as OpenrpcDocument
    )) as any;

    expect(result.methods[0].result.schema.properties.foo).toBe(
      result.components.schemas.foo
    );
  });

  it("throws when a schema cannot be resolved from components", async () => {
    expect.assertions(1);

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
            schema: {
              type: "object",
              properties: {
                foo: { $ref: "#/components/schemas/foo" },
              },
            },
          },
        },
      ],
      components: {
        schemas: {
          foo: { $ref: "#/components/schemas/bar" },
          bar: { $ref: "#/not/real" },
        },
      },
    };

    try {
      (await dereferenceDocument(testDoc as OpenrpcDocument)) as any;
    } catch (e) {
      expect(e).toBeInstanceOf(OpenRPCDocumentDereferencingError);
    }
  });
});
