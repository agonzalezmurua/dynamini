import Factory from "../../factory";
import { DocumentClient } from "aws-sdk/clients/dynamodb";
import {
  FilterExpressionType,
  AttributesToGet,
  ParseFilterExpressions
} from "../utils/ParseQueryOrScanParameters";
import { AWSError } from "aws-sdk";

type Parameters<T> = {
  indexName?: string;
  expression?: FilterExpressionType<T, Extract<keyof T, string>>;
  attributesToGet?: AttributesToGet<T>;
  limit?: number;
};

export type ScanOperationType<T> = (
  parameters: Parameters<T>
) => Promise<Array<T>>;

/**
 * Módulo de operaciónes con interacción con BD
 */
export default <T>(
  $factory: Factory<T>,
  $document_client: DocumentClient
): ScanOperationType<T> => (parameters: Parameters<T>) => {
  const input: AWS.DynamoDB.DocumentClient.ScanInput = {
    TableName: $factory.schema_name,
    ...ParseFilterExpressions<T>(
      undefined,
      parameters.expression,
      parameters.attributesToGet
    ),
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
      $document_client.scan(input, handleQuery);
    } catch (error) {
      reject(error);
    }
  });
};
