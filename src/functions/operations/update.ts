import Factory from "../../factory";
import { DocumentClient } from "aws-sdk/clients/dynamodb";
import ParseValuePairedExpression from "../utils/ParseValuePairedExpression";
import ParseSchemeConstraintsIntoExpression from "../utils/ParseSchemeConstraintsIntoExpression";

export type UpdateExpressionType<
  ObjectType,
  Keys extends Extract<keyof ObjectType, string>
> = Partial<{ [keys in Keys]: string }>;

export type UpdateOperationType<T> = (
  key: Partial<T>,
  expression: UpdateExpressionType<T, Extract<keyof T, string>>
) => Promise<T>;

export default <T>(
  $factory: Factory<T>,
  $document_client: DocumentClient
): UpdateOperationType<T> => async (key, expression) => {
  const {
    expressionAttributeNames,
    expressionAttributeValues,
    literalExpression,
    rawMap
  } = ParseValuePairedExpression(expression);
  const { condition, conditionExpressionValues } = ParseSchemeConstraintsIntoExpression($factory, rawMap)
  const input: DocumentClient.UpdateItemInput = {
    TableName: $factory.schema_name,
    Key: key,
    UpdateExpression: literalExpression,
    ExpressionAttributeNames: expressionAttributeNames,
    ExpressionAttributeValues: {
      ...expressionAttributeValues,
      ...conditionExpressionValues
    },
    ReturnValues: "ALL_NEW",
    ConditionExpression: condition
  };
  console.log(input)
  const { Attributes } = await $document_client.update(input).promise()
  
  return Attributes as T;
};
