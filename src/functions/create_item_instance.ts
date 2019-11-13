import Store from "../store";
import { Factory } from "../models/factory";
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
  class Instance<T> implements Instance<T> {
    public readonly attributes: T;

    constructor(item: T) {
      this.attributes = item;
    }

    public save() {
      return ComposeSave<T>(
        // @ts-ignore
        $factory,
        Store.getDocumentClient($factory.store_alias).client
      )(this.attributes);
    }

    setAttribute<U extends Extract<keyof T, string>>(
      key: U,
      value: T[U]
    ): void {
      $factory.validateAttribute(key, value);
      this.attributes[key as string] = value;
    }
  }

  return new Instance<T>(item);
}
