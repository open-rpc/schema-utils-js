import type { V1_4, V1_3 } from "@open-rpc/spec-types";

export type { V1_4, V1_3 };

// Union types for version-agnostic usage
export type OpenrpcDocument = V1_4.OpenrpcDocument | V1_3.OpenrpcDocument;
export type MethodObject = V1_4.MethodObject | V1_3.MethodObject;
export type ContentDescriptorObject = V1_4.ContentDescriptorObject | V1_3.ContentDescriptorObject;
export type JSONSchema = V1_4.JSONSchema | V1_3.JSONSchema;
export type ReferenceObject = V1_4.ReferenceObject | V1_3.ReferenceObject;
export type MethodOrReference = V1_4.MethodOrReference | V1_3.MethodOrReference;
export type ExamplePairingObject = V1_4.ExamplePairingObject | V1_3.ExamplePairingObject;
export type SchemaComponents = V1_4.SchemaComponents | V1_3.SchemaComponents;
export type ContentDescriptorComponents =
  | V1_4.ContentDescriptorComponents
  | V1_3.ContentDescriptorComponents;

export type RefNode = { $ref: string };

export type NoRefs<T> =
  // If T itself is a ref → remove it
  T extends RefNode
    ? never
    : // If T is an array → apply recursively to element type
    T extends (infer U)[]
    ? NoRefs<U>[]
    : // If T is an object → map over its properties
    T extends object
    ? { [K in keyof T]: NoRefs<T[K]> }
    : // Primitives (string, number, etc.) are left as-is
      T;
