import {
  BrowserProvider,
  Eip1193Provider,
  JsonRpcPayload,
  JsonRpcResult,
  JsonRpcError,
  Networkish,
  assertArgument,
} from "ethers";

export class BProvider extends BrowserProvider {
  #request: (
    method: string,
    params: Array<any> | Record<string, any>
  ) => Promise<any>;

  constructor(ethereum: Eip1193Provider, network?: Networkish) {
    super(ethereum, network);

    this.#request = async (
      method: string,
      params: Array<any> | Record<string, any>
    ) => {
      const payload = { method, params };
      this.emit("debug", { action: "sendEip1193Request", payload });
      try {
        const result = await ethereum.request(payload);
        this.emit("debug", { action: "receiveEip1193Result", result });
        return result;
      } catch (e: any) {
        const error = new Error(e.message);
        (<any>error).code = e.code;
        (<any>error).data = e.data;
        (<any>error).payload = payload;
        this.emit("debug", { action: "receiveEip1193Error", error });
        throw error;
      }
    };
  }

  async _send(
    payload: JsonRpcPayload | Array<JsonRpcPayload>
  ): Promise<Array<JsonRpcResult | JsonRpcError>> {
    assertArgument(
      !Array.isArray(payload),
      "EIP-1193 does not support batch request",
      "payload",
      payload
    );

    try {
      const result = await this.#request(payload.method, payload.params || []);
      return [{ id: payload.id, result: result.result || result }];
    } catch (e: any) {
      return [
        {
          id: payload.id,
          error: { code: e.code, data: e.data, message: e.message },
        },
      ];
    }
  }
}
