import { DocumentClient } from "aws-sdk/clients/dynamodb";
import ParseValuePairedExpression from "./ParseValuePairedExpression";

export type FilterExpressionType<
  ObjectType,
  Keys extends Extract<keyof ObjectType, string>
> = Partial<{ [keys in Keys]: string }>;

export type Key<T> = Partial<T>;
export type AttributesToGet<T> = Array<keyof T>;

type ParsedExpression = {
  KeyConditionExpression: string;
  FilterExpression?: string;
  ExpressionAttributeValues: DocumentClient.ExpressionAttributeValueMap;
  ExpressionAttributeNames: DocumentClient.ExpressionAttributeValueMap;
  ProjectionExpression?: string;
};

export function ParseFilterExpressions<T = any>(
  keys?: Key<T>,
  expression?: FilterExpressionType<T, Extract<keyof T, string>>,
  attributesToGet?: AttributesToGet<T>
): ParsedExpression {
  let KeyConditionExpression = "";
  let ExpressionAttributeValues: DocumentClient.ExpressionAttributeValueMap = {};
  let ExpressionAttributeNames: DocumentClient.ExpressionAttributeValueMap = {};
  let FilterExpression: string | undefined = undefined;
  let ProjectionExpression: string | undefined = undefined;

  keys &&
    Object.entries(keys).forEach(([key, value]) => {
      const keyName = `#${key}`;
      const valueName = `:${key}`;
      KeyConditionExpression += `${keyName} = ${valueName}`;
      ExpressionAttributeNames[keyName] = key;
      ExpressionAttributeValues[valueName] = value;
    });

  if (expression) {
    const parsedExpression = ParseValuePairedExpression(expression)
    FilterExpression = parsedExpression.literalExpression;
    ExpressionAttributeNames = { ...ExpressionAttributeNames, ...parsedExpression.expressionAttributeNames };
    ExpressionAttributeValues = { ...ExpressionAttributeNames, ...parsedExpression.expressionAttributeValues };
  }

  if (attributesToGet) {
    attributesToGet.forEach(attribute => {
      const keyName = `#${attribute}`;
      ExpressionAttributeNames[keyName] = attribute;
    });
    ProjectionExpression = attributesToGet.map(k => `#${k}`).join(", ");
  }

  return {
    ExpressionAttributeNames,
    ExpressionAttributeValues,
    KeyConditionExpression,
    FilterExpression,
    ProjectionExpression
  };
}
