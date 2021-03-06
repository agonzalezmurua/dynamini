import Factory from "../../factory";
import { DocumentClient } from "aws-sdk/clients/dynamodb";
import { AWSError } from "aws-sdk";
import {
  ParseFilterExpressions,
  FilterExpressionType,
  AttributesToGet,
  Key
} from "../utils/ParseQueryOrScanParameters";

type Parameters<T> = {
  expression?: FilterExpressionType<T, Extract<keyof T, string>>;
  attributesToGet?: AttributesToGet<T>;
  indexName?: string;
  limit?: number;
};

export type QueryOperationType<T> = (
  keys: Key<T>,
  parameters: Parameters<T>
) => Promise<Array<T>>;

/**
 * Módulo de operaciónes con interacción con BD
 */
export default <T>(
  $factory: Factory<T>,
  $document_client: DocumentClient
): QueryOperationType<T> => (keys: Key<T>, parameters: Parameters<T>) => {
  const parsedExpressions = ParseFilterExpressions(
    keys,
    parameters.expression,
    parameters.attributesToGet
  );
  const input: AWS.DynamoDB.DocumentClient.QueryInput = {
    TableName: $factory.schema_name,
    KeyConditionExpression: parsedExpressions.KeyConditionExpression,
    FilterExpression: parsedExpressions.FilterExpression,
    ExpressionAttributeValues: parsedExpressions.ExpressionAttributeValues,
    ExpressionAttributeNames: parsedExpressions.ExpressionAttributeNames,
    ProjectionExpression: parsedExpressions.ProjectionExpression,
    IndexName: parameters.indexName,
    Limit: parameters.limit
  };

  const items: T[] = [];
  return new Promise<T[]>((resolve, reject) => {
    function handleQuery(err: AWSError, data: DocumentClient.QueryOutput) {
      if (err) {
        return reject(err);
      }

      items.push(...(data.Items as T[]));

      if (data.LastEvaluatedKey !== undefined) {
        input.ExclusiveStartKey = data.LastEvaluatedKey;
        $document_client.query(input, handleQuery);
      } else {
        return resolve(items);
      }
    }
    try {
      $document_client.query(input, handleQuery);
    } catch (error) {
      reject(error);
    }
  });
};
