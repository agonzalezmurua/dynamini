import { REGEX } from "./REGEX";
import { DocumentClient } from "aws-sdk/clients/dynamodb";

const prefix = "exp";
export type RawExpressionMap = {
  [key: string]: {
    attributeValueKey: string;
    attributeValueName: string;
    interpretedValue: string | number;
  };
};

export default function ParseValuePairedExpression(objectExpression: {
  [key: string]: string | undefined;
}) {
  let literalExpression = "";
  const expressionAttributeValues: DocumentClient.ExpressionAttributeValueMap = {};
  const expressionAttributeNames: DocumentClient.ExpressionAttributeNameMap = {};

  const rawMap: RawExpressionMap = {};

  Object.entries(objectExpression).forEach(([expressionKey, expression]) => {
    if (expression === undefined || typeof expression !== "string") {
      return;
    }
    let expressionSegment: string = String(expression);
    const matchedValues = expressionSegment.match(REGEX.EXPRESSION_VALUES);
    const nameKey = `#${prefix}_${expressionKey}`;
    expressionAttributeNames[nameKey] = expressionKey;
    if (matchedValues === null) {
      throw new Error(
        `Missing expression values for attrbiute ${expressionKey}`
      );
    }
    matchedValues.forEach((match, index) => {
      let value = undefined;
      // @ts-ignore
      const [, matchType, matchValue] = match.match(REGEX.EXPRESSION_VALUE); // [1] represents the group match
      switch (matchType) {
        case "N":
          value = Number(matchValue);
          break;
        case "S":
        default:
          value = String(matchValue);
          break;
      }
      const valueKey = `:${prefix}_${expressionKey}_val_${index + 1}`;
      expressionAttributeValues[valueKey] = value;
      expressionSegment = expressionSegment.replace(match, valueKey);
      rawMap[expressionKey] = {
        attributeValueName: valueKey,
        attributeValueKey: nameKey,
        interpretedValue: value
      };
    });

    expressionSegment = expressionSegment.replace(
      REGEX.EXPRESSION_ATTRIBUTE,
      nameKey
    );
    literalExpression = `${literalExpression} ${expressionSegment}`;
  });

  return {
    literalExpression,
    expressionAttributeNames,
    expressionAttributeValues,
    rawMap
  };
}
