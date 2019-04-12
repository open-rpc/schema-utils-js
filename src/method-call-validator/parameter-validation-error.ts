import { ErrorObject } from "ajv";
import { types } from "@open-rpc/meta-schema";

/**
 * Provides an error interface for handling when a function call has invalid parameters.
 */
export default class MethodCallParameterValidationError extends Error {

  /**
   * @param paramIndex The index of the param that for this error (index
   * of the param in MethodObject.params).
   * @param expectedSchema The expected JSON Schema for the passed in value.
   * @param receievedParam The value of the param passed to the method call.
   * @param errors The errors recieved by ajv
   */
  constructor(
    public paramIndex: number,
    public expectedSchema: types.Schema,
    public receievedParam: any,
    private errors: ErrorObject[],
  ) {
    super([
      "Expected param in position ",
      paramIndex,
      " to match the json schema: ",
      JSON.stringify(expectedSchema, undefined, "  "),
      ". The function received instead ",
      receievedParam,
      ".",
    ].join(""));
  }
}
