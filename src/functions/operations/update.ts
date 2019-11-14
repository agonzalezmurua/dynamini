import Factory from "../../factory";
import { DocumentClient } from "aws-sdk/clients/dynamodb";
import { GetOperationType } from "./get";
import ParseValuePairedExpression from "../utils/ParseValuePairedExpression";
import { ItemInstance } from "../create_item_instance";
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
  $factory: Factory,
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
  const { Attributes } = await $document_client.update(input).promise()
  
  return Attributes as T;
};
