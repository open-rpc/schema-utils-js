import { OpenRPCSpecificationSchema1_3, OpenRPCSpecificationSchema1_4 } from "test-open-rpc-spec";

const getMetaSchemaForVersion = (version: string) => {
  if (/^1\.4(\..*)?$/.test(version)) return OpenRPCSpecificationSchema1_4;
  if (/^1\./.test(version)) return OpenRPCSpecificationSchema1_3;
  throw new Error(`Unsupported OpenRPC schema version: ${version}`);
};

export default getMetaSchemaForVersion;
