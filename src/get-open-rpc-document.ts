import { OpenrpcDocument as OpenRPC } from "@open-rpc/meta-schema";
export type TGetOpenRPCDocument = (schema: string) => Promise<OpenRPC>;
