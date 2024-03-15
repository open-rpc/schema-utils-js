import { OpenrpcDocument as OpenRPC } from "@open-rpc/meta-schema";
import fetch from "isomorphic-fetch";
import { TGetOpenRPCDocument } from "./get-open-rpc-document";

const fetchUrlSchema: TGetOpenRPCDocument = async (schema) => {
  try {
    const response = await fetch(schema);
    return (await response.json()) as OpenRPC;
  } catch (e) {
    throw new Error(`Unable to download openrpc.json file located at the url: ${schema}`);
  }
};

export default fetchUrlSchema;
