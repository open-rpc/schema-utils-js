import { OpenrpcDocument } from "@open-rpc/meta-schema";
import fallbackExamples from "./fallback-examples";

const workingDocument: OpenrpcDocument = {
  info: {
    title: "foo",
    version: "1",
  },
  methods: [],
  openrpc: "1.0.0-rc1",
};

describe("fallbackExamples", () => {

  it("doesnt explode", async () => {
    expect.assertions(1);
    const document = await fallbackExamples(workingDocument);
    expect(document.methods).toBeDefined();
  });

  it("leaves existing examples", async () => {
    expect.assertions(3);
    const testDoc: OpenrpcDocument = {
      info: {
        title: "foo",
        version: "1",
      },
      methods: [
        {
          name: "foo",
          params: [],
          result: {
            name: "foo",
            schema: {
              type: "string"
            },
          },
          examples: [
            {
              name: "foo",
              params: [],
              result: {
                name: "my-example",
                value: "bar"
              },

            }
          ]
        }
      ],
      openrpc: "1.0.0-rc1",
    };
    const document = await fallbackExamples(testDoc);
    expect(document.methods[0].examples).toBeDefined();
    expect(document.methods[0].examples).toHaveLength(1);
    expect((document.methods[0].examples![0] as any).result.value).toEqual("bar");
  });

  it("can fallback examples", async () => {
    expect.assertions(3);
    const testDoc: OpenrpcDocument = {
      info: {
        title: "foo",
        version: "1",
      },
      methods: [
        {
          name: "foo",
          params: [],
          result: {
            name: "foo",
            schema: {
              type: "string",
              examples: [
                "bar"
              ]
            },
          },
        }
      ],
      openrpc: "1.0.0-rc1",
    };
    const document = await fallbackExamples(testDoc);
    expect(document.methods[0].examples).toBeDefined();
    expect(document.methods[0].examples).toHaveLength(1);
    expect((document.methods[0].examples![0] as any).result.value).toEqual("bar");
  });

  it("doesnt explode with no schema", async () => {
    expect.assertions(1);
    const testDoc = {
      info: {
        title: "foo",
        version: "1",
      },
      methods: [
        {
          name: "foo",
          result: {
            name: "foo",
          },
        }
      ],
      openrpc: "1.0.0-rc1",
    };
    const document = await fallbackExamples(testDoc as any);
    expect(document.methods[0]).toBeDefined();
  });

  it("doesnt explode with no examples", async () => {
    expect.assertions(1);
    const testDoc = {
      info: {
        title: "foo",
        version: "1",
      },
      methods: [
        {
          name: "foo",
          result: {
            name: "foo",
            schema: {
              type: "string",
              examples: []
            },
          },
        }
      ],
      openrpc: "1.0.0-rc1",
    };
    const document = await fallbackExamples(testDoc as any);
    expect(document.methods[0]).toBeDefined();
  });

  it("doesnt explode with no method params", async () => {
    expect.assertions(2);
    const testDoc = {
      info: {
        title: "foo",
        version: "1",
      },
      methods: [
        {
          name: "foo",
          result: {
            name: "foo",
            schema: {
              type: "string",
              examples: [
                "bar"
              ]
            },
          },
        }
      ],
      openrpc: "1.0.0-rc1",
    };
    const document = await fallbackExamples(testDoc as any);
    expect(document.methods[0]).toBeDefined();
    expect((document.methods[0].examples![0] as any).result.value).toEqual("bar");
  });

  it("doesnt explode with schema true", async () => {
    expect.assertions(1);
    const testDoc: OpenrpcDocument = {
      info: {
        title: "foo",
        version: "1",
      },
      methods: [
        {
          name: "foo",
          params: [],
          result: {
            name: "foo",
            schema: true
          },
        }
      ],
      openrpc: "1.0.0-rc1",
    };
    const document = await fallbackExamples(testDoc);
    expect(document.methods[0]).toBeDefined();
  });

  it("can fallback examples with params", async () => {
    expect.assertions(3);
    const testDoc: OpenrpcDocument = {
      info: {
        title: "foo",
        version: "1",
      },
      methods: [
        {
          name: "foo",
          params: [
            {
              name: "foobarbaz",
              schema: {
                type: "string",
                examples: [
                  "potato123"
                ]
              },
            }
          ],
          result: {
            name: "foo",
            schema: {
              type: "string",
              examples: [
                "bar"
              ]
            },
          },
        }
      ],
      openrpc: "1.0.0-rc1",
    };
    const document = await fallbackExamples(testDoc);
    expect(document.methods[0].examples).toBeDefined();
    expect(document.methods[0].examples).toHaveLength(1);
    expect((document.methods[0].examples![0] as any).params[0].value).toEqual("potato123");
  });

  it("can fallback multiple examples with params", async () => {
    expect.assertions(4);
    const testDoc: OpenrpcDocument = {
      info: {
        title: "foo",
        version: "1",
      },
      methods: [
        {
          name: "foo",
          params: [
            {
              name: "foobarbaz",
              schema: {
                type: "string",
                examples: [
                  "potato123",
                  "potato2"
                ]
              },
            },
            {
              name: "bazbazbaz",
              schema: {
                type: "string",
                examples: [
                  "bazpotato123",
                  "bazpotato2"
                ]
              },
            }
          ],
          result: {
            name: "foo",
            schema: {
              type: "string",
              examples: [
                "bar",
                "baz"
              ]
            },
          },
        }
      ],
      openrpc: "1.0.0-rc1",
    };
    const document = await fallbackExamples(testDoc);
    expect(document.methods[0].examples).toBeDefined();
    expect(document.methods[0].examples).toHaveLength(2);
    expect((document.methods[0].examples![0] as any).params[0].value).toEqual("potato123");
    expect((document.methods[0].examples![1] as any).params[0].value).toEqual("potato2");
  });

})
