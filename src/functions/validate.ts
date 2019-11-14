import { AttributeSchema } from "../factory";

export function testType(schema: AttributeSchema, value: any): boolean {
  switch (schema.type) {
    case String: {
      return typeof value === "string";
    }
    case Array: {
      return Array.isArray(value);
    }
    case Number: {
      return typeof value === "number";
    }
    case Object: {
      return value === "object";
    }
    default: {
      return false;
    }
  }
}

export function testMinMax(
  schema: AttributeSchema,
  value: any,
  mode: "min" | "max" = "min"
) {
  let output = false;
  switch (schema.type) {
    case String: {
      output = (value as string).length >= schema[mode]!;
      break;
    }
    case Array: {
      output = (value as Array<any>).length >= schema[mode]!;
      break;
    }
    case Number: {
      output = (value as number) >= schema[mode]!;
      break;
    }
    default: {
      output;
      break;
    }
  }

  switch (mode) {
    case "max":
      return !output;
    case "min":
      return output;
    default:
      return output;
  }
}

export function testValidate(schema: AttributeSchema, value: any): boolean {
  if (typeof schema.validate === "function") {
    return schema.validate(value);
  } else {
    switch (schema.type) {
      case String:
      case Number:
        return (schema.validate as RegExp).test(value);
      default:
        return true;
    }
  }
}

export default {
  isValidType: testType,
  isMinMaxValid: testMinMax,
  doesPassValidate: testValidate
};
