import { spec } from "test-open-rpc-spec-types";

const getMetaSchemaForVersion = (version: string) => {
  if (/^1\.4(\..*)?$/.test(version)) return spec.OpenRPCSpecificationSchema1_4;
  if (/^1\./.test(version)) return spec.OpenRPCSpecificationSchema1_3;
  throw new Error(`Unsupported OpenRPC schema version: ${version}`);
};

export default getMetaSchemaForVersion;
