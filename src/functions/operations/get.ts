import Factory, { NonKeyAttributeSchema } from "../../factory";
import { DocumentClient } from "aws-sdk/clients/dynamodb";
import { ItemInstance, CreateItemInstance } from "../create_item_instance";

export type GetOperationType<T> = (
  key: Partial<T>
) => Promise<ItemInstance<T>>;

export default <T>(
  $factory: Factory<T>,
  $document_client: DocumentClient
): GetOperationType<T> => async key => {
  const item = await $document_client
    .get({
      TableName: $factory.schema_name,
      Key: key
    })
    .promise()
    .then(response => response.Item as T);
  const instance = CreateItemInstance($factory, item);
  return instance;
};
