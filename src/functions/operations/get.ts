import Factory, { NonKeyAttributeSchema } from "../../models/factory";
import { DocumentClient } from "aws-sdk/clients/dynamodb";
import { ItemInstance, CreateItemInstance } from "../create_item_instance";

export type GetOperationType<T> = (
  attributes: Partial<T>
) => Promise<ItemInstance<T>>;

export default <T>(
  $factory: Factory<T>,
  $document_client: DocumentClient
): GetOperationType<T> => async attributes => {
  const item = await $document_client
    .get({
      TableName: schema_name,
      Key: attributes
    })
    .promise()
    .then(response => response.Item as T);
  const instance = CreateItemInstance($factory, item);
  return instance;
};
