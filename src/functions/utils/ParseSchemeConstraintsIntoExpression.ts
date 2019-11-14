import Factory, { AttributeSchema } from "../../factory";
import { RawExpressionMap } from "./ParseValuePairedExpression";
import { DocumentClient } from "aws-sdk/clients/dynamodb";

const prefix = "condition";

export default function ParseSchemeConstraintsIntoExpression(
  $factory: Factory,
  map: RawExpressionMap
) {
  let conditions: string[] = [];
  const conditionExpressionValues: DocumentClient.UpdateItemInput["ExpressionAttributeValues"] = {};

  Object.entries(map).forEach(([key, parsed]) => {
    const schema = $factory.attributeSchema[key];

    if (schema === undefined) {
      return;
    }
    if (schema.required === true) {
      conditions.push(`${parsed.attributeValueKey} NOT NULL`);
    }

    if (schema.min !== undefined) {
      const expressionValue = `:${prefix}_${key}_min`;
      conditions.push(`size(${parsed.attributeValueKey}) < ${expressionValue}`);
      conditionExpressionValues[expressionValue] = schema.min;
    }

    if (schema.max !== undefined) {
      const expressionValue = `:${prefix}_${key}_max`;
      conditions.push(`size(${parsed.attributeValueKey}) > ${expressionValue}`);
      conditionExpressionValues[expressionValue] = schema.max;
    }
  });

  return {
    condition: conditions.join(" AND "),
    conditionExpressionValues
  }
}
