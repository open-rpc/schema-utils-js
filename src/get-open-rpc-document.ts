import fetch from "node-fetch";
import { readJson, pathExists } from "fs-extra";
import { OpenRPC } from "@open-rpc/meta-schema";

type TGetOpenRPCDocument = (schema: string) => Promise<OpenRPC>;

const fetchUrlSchemaFile: TGetOpenRPCDocument = async (schema) => {
  try {
    const response = await fetch(schema);
    return await response.json() as OpenRPC;
  } catch (e) {
    throw new Error(`Unable to download openrpc.json file located at the url: ${schema}`);
  }
};

const readSchemaFromFile: TGetOpenRPCDocument = async (filePath: string) => {
  let isCorrectPath: boolean;
  try {
    isCorrectPath = await pathExists(filePath);
  } catch (e) {
    throw new Error(`problem reading the file: ${e.message}`);
  }

  if (isCorrectPath === false) {
    throw new Error(`unable to find file ${filePath}`);
  }

  try {
    return await readJson(filePath) as OpenRPC;
  } catch (e) {
    if (e.message.includes("SyntaxError")) {
      throw new Error(`Failed to parse json in file ${filePath}`);
    } else {
      throw new Error(`Unable to read openrpc.json file located at ${filePath}`);
    }
  }
};

export { fetchUrlSchemaFile, readSchemaFromFile };
