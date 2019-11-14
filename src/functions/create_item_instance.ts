import Store from "../Store";
import { Factory } from "../factory";
import { PromiseResult } from "aws-sdk/lib/request";
import { AWSError, DynamoDB } from "aws-sdk";
import ComposeSave from "../functions/operations/save";

export interface ItemInstance<T> {
  attributes: T;
  save(): Promise<
    PromiseResult<DynamoDB.DocumentClient.PutItemOutput, AWSError>
  >;
  setAttribute<U extends Extract<keyof T, string>>(key: U, value: T[U]): void;
}

export function CreateItemInstance<T>(
  $factory: Factory<T>,
  item: T
): ItemInstance<T> {
  const operations = {
    save: ComposeSave<T>(
      // @ts-ignore
      $factory,
      Store.getDocumentClient($factory.store_alias)!.client
    )
  }
  class Instance<T> implements Instance<T> {
    public readonly attributes: T;

    constructor(item: T) {
      this.attributes = item;
    }

    public async save() {
      return operations.save(this.attributes as any);
    }

    setAttribute<U extends Extract<keyof T, string>>(
      key: U,
      value: T[U]
    ): void {
      // @ts-ignore, these are the same, dk how to fix atm
      $factory.validateAttribute(key, value);
      this.attributes[key] = value;
    }
  }

  return new Instance<T>(item);
}
