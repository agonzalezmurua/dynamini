import Factory from "../../factory";
import { DocumentClient } from "aws-sdk/clients/dynamodb";

export default <T>($factory: Factory<T>, $document_client: DocumentClient) => (
  item: T
) => () => {
  const errors = $factory.validateItem(item);

  if (errors.length !== 0) {
    throw errors;
  }
  const attributes: any = {};

  Object.keys($factory.attributeSchema).forEach(key => {
    attributes[key] = (item as any)[key];
  });

  return $document_client
    .put({
      TableName: $factory.schema_name,
      Item: item
    })
    .promise();
};
