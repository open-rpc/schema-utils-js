import { ErrorObject } from "ajv";
import { types } from "@open-rpc/meta-schema";

export class ParameterValidationError extends Error {
  constructor(paramIndex: number, expectedSchema: types.Schema, receievedParam: any, public errors: ErrorObject[]) {
    super();
    this.message = [
      "Expected param in position ",
      paramIndex,
      " to match the json schema: ",
      JSON.stringify(expectedSchema, undefined, "  "),
      ". The function received instead ",
      receievedParam,
      ".",
    ].join("");
  }
}
