import { DocumentClient } from "aws-sdk/clients/dynamodb";
import Factory, { AttributeSchema } from "../../models/factory";

export type ExpressionType<
  ObjectType,
  Keys extends Extract<keyof ObjectType, string>
> = Partial<{ [keys in Keys]: string }>;

export type Key<T> = Partial<T>;
export type AttributesToGet<T> = Array<keyof T>;

export const REGEX = {
  EXPRESSION_ATTRIBUTE: /{attribute}/g,
  EXPRESSION_VALUES: /(N|S){(.*?)}/g,
  EXPRESSION_VALUE: /(N|S){(.*?)}/
};

type ParsedExpression = {
  KeyConditionExpression: string;
  FilterExpression?: string;
  ExpressionAttributeValues: DocumentClient.ExpressionAttributeValueMap;
  ExpressionAttributeNames: DocumentClient.ExpressionAttributeValueMap;
  ProjectionExpression?: string;
};

export function ParseExpressions<T = any>(
  keys?: Key<T>,
  expression?: ExpressionType<T, Extract<keyof T, string>>,
  attributesToGet?: AttributesToGet<T>
): ParsedExpression {
  let KeyConditionExpression = "";
  const ExpressionAttributeValues: DocumentClient.ExpressionAttributeValueMap = {};
  const ExpressionAttributeNames: DocumentClient.ExpressionAttributeValueMap = {};
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
    FilterExpression = "";
    Object.entries(expression).forEach(([key, expression]) => {
      let filterExpression: string = String(expression);
      const matchedValues = filterExpression.match(REGEX.EXPRESSION_VALUES);
      const nameKey = `#${key}`;
      ExpressionAttributeNames[nameKey] = key;

      matchedValues.forEach((match, index) => {
        let value = undefined;
        const [, matchType, matchValue] = match.match(REGEX.EXPRESSION_VALUE); // [1] representa al group match
        switch (matchType) {
          case "S":
            value = String(matchValue);
            break;
          case "N":
            value = Number(matchValue);
            break;
        }
        const valueKey = `:${key}_val_${index + 1}`;
        ExpressionAttributeValues[valueKey] = value;
        filterExpression = filterExpression.replace(match, valueKey);
      });

      filterExpression = filterExpression.replace(
        REGEX.EXPRESSION_ATTRIBUTE,
        nameKey
      );
      FilterExpression = `${FilterExpression} ${filterExpression}`;
    });
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
