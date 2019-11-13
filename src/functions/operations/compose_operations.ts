import Factory from "../../factory";
import { StoreItemType } from "../../store"
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
  $store_item?: StoreItemType
): ComposedOperationType<T> => {
  if (!$store_item) {
    throw new Error(`No matching store "${$factory.store_alias}" has been provided for Factory ${$factory.schema_name}`)
  }
  const client = $store_item.client
  return {
    query: ComposeQuery<T>($factory, client),
    get: ComposeGet<T>($factory, client),
    scan: ComposeScan<T>($factory, client)
  };
};
