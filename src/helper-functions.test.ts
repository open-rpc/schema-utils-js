/* eslint-disable @typescript-eslint/no-explicit-any */
import * as help from "./helper-functions";
import { OpenrpcDocument as OpenRPC } from "@open-rpc/meta-schema";

describe("helper functions", () => {
  describe("find", () => {
    it("array empty fail", () => {
      const array: any[] = [];
      expect(
        help.find(array, (o: any[]) => {
          return o === null;
        })
      ).toBe(undefined);
    });
  });

  describe("findIndex", () => {
    it("array empty fail", () => {
      const array: any[] = [];
      expect(
        help.findIndex(array, (o: any[]) => {
          return o === null;
        })
      ).toBe(-1);
    });
  });

  describe("rpcDocIsEqual", () => {
    it("missing key", () => {
      const doc1: OpenRPC = {
        info: {
          description: "test-doc",
          title: "testDoc",
          version: "1.0.0",
        },
        methods: [],
        openrpc: "1.0.0",
        components: [],
      };
      const doc2: OpenRPC = {
        info: {
          description: "test-doc",
          title: "testDoc",
          version: "1.0.0",
        },
        methods: [],
        openrpc: "1.0.0",
        servers: [],
      };
      expect(help.rpcDocIsEqual(doc1, doc2)).toBe(false);
    });
    it("length mismatch", () => {
      const doc1: OpenRPC = {
        info: {
          description: "test-doc",
          title: "testDoc",
          version: "1.0.0",
        },
        methods: [],
        openrpc: "1.0.0",
        servers: [],
      };
      const doc2: OpenRPC = {
        info: {
          description: "test-doc",
          title: "testDoc",
          version: "1.0.0",
        },
        methods: [],
        openrpc: "1.0.0",
      };
      expect(help.rpcDocIsEqual(doc1, doc2)).toBe(false);
    });
    it("same key different value in recursive step", () => {
      const doc1: OpenRPC = {
        info: {
          description: "test-doc",
          title: "testDoc",
          version: "1.0.0",
          license: {
            name: "MIT",
          },
        },
        methods: [],
        openrpc: "1.0.0",
      };
      const doc2: OpenRPC = {
        info: {
          description: "test-doc",
          title: "testDoc",
          version: "1.0.0",
          license: {
            name: "APACHE2",
          },
        },
        methods: [],
        openrpc: "1.0.0",
      };
      expect(help.rpcDocIsEqual(doc1, doc2)).toBe(false);
    });
  });
});
