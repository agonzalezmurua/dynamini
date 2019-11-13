import { DocumentClient } from "aws-sdk/clients/dynamodb";
import Factory from "../../factory";
import ComposeQuery, { QueryOperationType } from "./query";
import ComposeGet, { GetOperationType } from "./get";
import ComposeScan, { ScanOperationType } from "./scan";

export type ComposedOperationType<T> = {
  query: QueryOperationType<T>;
  get: GetOperationType<T>;
  scan: ScanOperationType<T>;
};

export default <T>(
  $factory: Factory<T>,
  $document_client: DocumentClient
): ComposedOperationType<T> => {
  return {
    query: ComposeQuery<T>($factory, $document_client),
    get: ComposeGet<T>($factory, $document_client),
    scan: ComposeScan<T>($factory, $document_client)
  };
};
