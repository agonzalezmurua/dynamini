import Store from "./store";
import {
  CreateItemInstance,
  ItemInstance
} from "./functions/create_item_instance";
import Validate from "./functions/validate";
import ComposeOperations, {
  ComposedOperationType
} from "./functions/operations/compose_operations";

export type NonKeyAttributeSchema = {
  type: (value: any) => void;
  attribute_kind: "attribute";
  required?: boolean;
  validate?: Function | RegExp;
  min?: number;
  max?: number;
};

export type KeyAttributeSchema = {
  attribute_kind: "primary" | "sort";
  type: (value: any) => void;
  required?: boolean;
  validate?: Function | RegExp;
  min?: number;
  max?: number;
};

type FactoryOptions = {
  raiseErrorOnInvalidProp: boolean;
};

export type AttributeSchema = NonKeyAttributeSchema | KeyAttributeSchema;

type AttributeSchemas<T> = {
  [key in Extract<keyof T, string>]: AttributeSchema;
};

const defaultFactoryOptions: FactoryOptions = {
  raiseErrorOnInvalidProp: false
};

export type ItemDefinition = { [key: string]: {} };

export class Factory<T = ItemDefinition> {
  public operation: ComposedOperationType<T>;
  public attributeSchema: AttributeSchemas<T>;
  private options: FactoryOptions;
  /** Nombre de Tabla */
  public readonly schema_name: string;
  /** Alias de DocumentClient */
  public readonly store_alias: string;

  constructor(
    name: string,
    store_alias: string,
    attributeSchema: AttributeSchemas<T>,
    options: FactoryOptions = defaultFactoryOptions
  ) {
    this.options = { ...defaultFactoryOptions, ...options };
    this.schema_name = name;
    this.store_alias = store_alias;
    this.attributeSchema = attributeSchema;
    this.operation = ComposeOperations(
      this,
      Store.getDocumentClient(this.store_alias)
    );
  }

  private _raiseError(data: any) {
    if (this.options.raiseErrorOnInvalidProp === true) {
      throw new Error(data);
    } else {
      console.warn(data);
    }
  }

  private _testField(schema: AttributeSchema, key: string, value: any): void {
    if (
      (schema.required === true ||
        schema.attribute_kind === "primary" ||
        schema.attribute_kind === "sort") &&
      (value === null || value === undefined)
    ) {
      return this._raiseError(
        `Schema validation exception: "${key}" is required`
      );
    } else {
      // Value exists
      if (Validate.isValidType(schema, value) === false) {
        return this._raiseError(
          `Schema validation exception: "${key}" does not satisfy constraint 'type'`
        );
      }

      if (
        schema.min &&
        Validate.isMinMaxValid(schema, value, "min") === false
      ) {
        return this._raiseError(
          `Schema validation exception: "${key}" does not satisfy constraint 'min'`
        );
      }

      if (
        schema.max &&
        Validate.isMinMaxValid(schema, value, "max") === false
      ) {
        return this._raiseError(
          `Schema validation exception: "${key}" does not satisfy constraint 'max'`
        );
      }

      if (
        schema.validate &&
        Validate.doesPassValidate(schema, value) === false
      ) {
        return this._raiseError(
          `Schema validation exception: "${key}" does not satisfy constraint 'max'`
        );
      }
    }
  }

  public validateItem(item: T) {
    const errorlist: { [key: string]: string }[] = [];
    Object.entries(this.attributeSchema).forEach(([key, schema]) => {
      try {
        const value = (item as any)[key];
        if (!schema) {
          this._raiseError(`Schema validation exception: unknown key "${key}"`);
        }
        this._testField(schema as NonKeyAttributeSchema, key, value);
      } catch (error) {
        errorlist.push({ [key]: error.message });
      }
    });
    return errorlist;
  }

  get keyAttributes() {
    const output: { [key: string]: KeyAttributeSchema } = {};
    Object.entries(this.attributeSchema)
      .filter(
        ([, def]) => (def as AttributeSchema).attribute_kind !== "attribute"
      )
      .map(([key, def]) => ({ key, def: def as KeyAttributeSchema }))
      .forEach(({ key, def }) => {
        output[key] = def;
      });
    return output;
  }

  public validateAttribute(key: Extract<keyof T, string>, value: any) {
    const schema = this.attributeSchema[key] as AttributeSchema;
    if (schema === undefined) {
      this._raiseError(`Schema validation exception: unkown attribute ${key}`);
    }

    this._testField(schema, key, value);
  }

  public create(item: T): ItemInstance<T> {
    return CreateItemInstance<T>(this, item);
  }
}

export default Factory;
