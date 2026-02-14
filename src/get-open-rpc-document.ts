import { OpenrpcDocument as OpenRPC } from "./types";
export type TGetOpenRPCDocument = (schema: string) => Promise<OpenRPC>;
