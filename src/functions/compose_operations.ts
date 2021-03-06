import Factory from "../factory";
import { StoreItemType } from "../Store"
import ComposeQuery, { QueryOperationType } from "./operations/query";
import ComposeGet, { GetOperationType } from "./operations/get";
import ComposeScan, { ScanOperationType } from "./operations/scan";
import ComposeUpdate, { UpdateOperationType } from "./operations/update";

export type ComposedOperationType<T> = {
  query: QueryOperationType<T>;
  get: GetOperationType<T>;
  scan: ScanOperationType<T>;
  update: UpdateOperationType<T>;
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
    scan: ComposeScan<T>($factory, client),
    update: ComposeUpdate<T>($factory, client),
  };
};
