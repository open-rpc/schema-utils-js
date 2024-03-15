import { MethodObject, OpenrpcDocument as OpenRPC } from "@open-rpc/meta-schema";

/**
 * Provides an error interface for handling when a method is trying to be called but does not exist.
 */
export default class MethodNotFoundError implements Error {
  public name = "MethodNotFoundError";
  public message: string;

  /**
   * @param methodName The method name that was used.
   * @param openrpcDocument The OpenRPC document that the method was used against.
   * @param receievedParams The params, if any, that were used.
   */
  constructor(
    public methodName: string,
    public openrpcDocument: OpenRPC,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    public receievedParams: any[] | Record<string, unknown> = []
  ) {
    const msg = [
      `Method Not Found Error for OpenRPC API named "${openrpcDocument.info.title}"`,
      `The requested method: "${methodName}" not a valid method.`,
    ];

    if (openrpcDocument.methods.length > 0) {
      msg.push(
        `Valid method names are as follows: ${(openrpcDocument.methods as MethodObject[])
          .map(({ name }) => name)
          .join(", ")}`
      );
    }

    let stringedParams;
    if (receievedParams instanceof Array) {
      if (receievedParams.length > 0) {
        stringedParams = receievedParams
          .map((p) => {
            try {
              return JSON.stringify(p);
            } catch (e) {
              return p;
            }
          })
          .join("\n");
      }
    } else {
      stringedParams = JSON.stringify(receievedParams);
    }

    if (stringedParams) {
      msg.push("Params:");
      msg.push(stringedParams);
    }

    this.message = msg.join("\n");
  }
}
