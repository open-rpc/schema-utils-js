import fs from "fs-extra";
import { OpenrpcDocument as OpenRPC } from "@open-rpc/meta-schema";
import { parseOpenRPCDocument } from "./";
import rimraf from "rimraf";
import { promisify } from "util";
import { isEqual } from "lodash";
import http from "http";
import { AddressInfo } from "net";
const rmDir = promisify(rimraf);

export const mockServer = (file: string): Promise<http.Server> => {
  return new Promise((resolve: (value: http.Server) => void) => {
    const testServer = http.createServer((req, res) => {
      const rs = fs.createReadStream(file);
      if (!req.url) { throw new Error("Request missing url"); }
      if (req.url.search("download") > 0) {
        res.writeHead(200, { "Content-Type": "application/json" });
        rs.pipe(res);
        rs.on("close", () => {
          res.end(null);
        });
        return;
      }
    });
    testServer.listen(0, () => { resolve(testServer); });
  });
};

describe("parseOpenRPCDocument", () => {
  let dirName: string;
  let testDocPath: string;
  let testServer: http.Server;
  const testDoc: OpenRPC = {
    info: {
      description: "test-doc",
      title: "testDoc",
      version: "1.0.0",
    },
    methods: [],
    openrpc: "1.0.0-rc1",
  };

  beforeAll(async () => {
    dirName = await fs.mkdtemp("test-openrpc-doc");
    testDocPath = `${dirName}/openrpc.json`;
    await fs.writeFile(testDocPath, JSON.stringify(testDoc, null, 2));
    testServer = await mockServer(testDocPath);
  });
  afterAll(async () => {
    await rmDir(dirName);
    await new Promise((resolve) => testServer.close(resolve));
  });

  it("should parseOpenRPCDocument from string", async () => {
    const doc = await parseOpenRPCDocument(JSON.stringify(testDoc, null, 2));
    expect(isEqual(doc, testDoc)).toBe(true);
  });

  it("should parseOpenRPCDocument from file", async () => {
    const doc = await parseOpenRPCDocument(testDocPath);
    expect(isEqual(doc, testDoc)).toBe(true);
  });

  it("should parseOpenRPCDocument from server", async () => {
    const { port } = testServer.address() as AddressInfo;
    const doc = await parseOpenRPCDocument(`http://localhost:${port}/download/openrpc.json`);
    expect(isEqual(doc, testDoc)).toBe(true);
  });

});
