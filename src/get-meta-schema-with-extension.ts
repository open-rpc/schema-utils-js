import metaSchema, { OpenrpcDocument as OpenRPC } from "@open-rpc/meta-schema";
import jsonSchema from "@json-schema-tools/meta-schema"
import extensionSchema from "./open-rpc-extensions-schema.json"

const getMetaSchemaWithExtensionSchema = ():any => {
    const extensionMetaSchemaCopy = { ...extensionSchema } as any;
    const metaSchemaCopy = { ...metaSchema } as any;
    delete extensionMetaSchemaCopy.$schema;
    delete extensionMetaSchemaCopy.$id;
    const jsonSchemaCopy = {...jsonSchema} as any;
    delete jsonSchemaCopy.$id;
    delete jsonSchemaCopy.$schema;
    extensionMetaSchemaCopy.properties['x-extensions'].items.properties.schema = jsonSchemaCopy // .schema = jsonSchemaCopy;
     metaSchemaCopy.properties['x-extensions'] ={"$ref":"#/definitions/x-extensions"} 
     metaSchemaCopy.definitions['x-extensions']=extensionMetaSchemaCopy.properties['x-extensions'];
    return metaSchemaCopy;  
};

export default getMetaSchemaWithExtensionSchema;
