import { ServiceConfigurationOptions } from "aws-sdk/lib/service";
import DynamoDB from "aws-sdk/clients/dynamodb";

export type StoreItemType = { alias: string; client: DynamoDB.DocumentClient };

class Store {
  private document_clients: StoreItemType[] = [];

  public register(
    alias: string,
    options: DynamoDB.DocumentClient.DocumentClientOptions &
      ServiceConfigurationOptions &
      DynamoDB.ClientApiVersions
  ) {
    const client = this.document_clients.find(s => s.alias === alias);
    if (client !== undefined) {
      return;
    }
    this.document_clients.push({
      alias,
      client: new DynamoDB.DocumentClient(options)
    });
  }

  public getDocumentClient(alias: string): StoreItemType | undefined {
    return this.document_clients.find(s => s.alias === alias);
  }
}

export default new Store();
