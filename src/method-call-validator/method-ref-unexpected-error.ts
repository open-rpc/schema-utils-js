import { OpenrpcDocument as OpenRPC } from "@open-rpc/meta-schema";

/**
 * Provides an error interface for handling when a method is trying to be called but does not exist.
 */
export default class MethodRefUnexpectedError implements Error {
  public name = "MethodRefUnexpectedError";
  public message: string;

  /**
   * @param methodRef The method reference that was discovered.
   * @param openrpcDocument The OpenRPC document that the method was used against.
   */
  constructor(public methodRef: string, public openrpcDocument: OpenRPC) {
    const msg = [
      `Method Ref Unexpected Error for OpenRPC API named "${openrpcDocument.info.title}"`,
      `The requested ref has not been resolved: "${methodRef}" not a valid dereferenced method.`,
    ];

    this.message = msg.join("\n");
  }
}
