import { UserOperation, Bundle } from "../operation";
import { toQuantity } from "ethers";
import isomorphicFetch from "isomorphic-fetch";
import * as url from "url";

const BASE_PATH = "/".replace(/\/+$/, "");

export interface FetchAPI {
  (url: string, init?: any): Promise<Response>;
}

export interface FetchArgs {
  url: string;
  options: any;
}

export class RequiredError extends Error {
  name = "RequiredError";
  constructor(public field: string, msg?: string) {
    super(msg);
  }
}

export const DAppApiFetchParamCreator = function () {
  return {
    /**
     * Get the Atlas transaction hash from a previously submitted bundle
     * @summary Get the Atlas transaction hash from a previously submitted bundle
     * @param {any} userOpHash The hash of the user operation
     * @param {any} [wait] Hold the request until having a response
     * @param {*} [options] Override http request option.
     * @throws {RequiredError}
     */
    getBundleHash(userOpHash: any, wait?: any, options: any = {}): FetchArgs {
      // verify required parameter 'userOpHash' is not null or undefined
      if (userOpHash === null || userOpHash === undefined) {
        throw new RequiredError(
          "userOpHash",
          "Required parameter userOpHash was null or undefined when calling getBundleHash."
        );
      }
      const localVarPath = "/bundleHash";
      const localVarUrlObj = url.parse(localVarPath, true);
      const localVarRequestOptions = Object.assign({ method: "GET" }, options);
      const localVarHeaderParameter = {} as any;
      const localVarQueryParameter = {} as any;

      if (userOpHash !== undefined) {
        localVarQueryParameter["userOpHash"] = userOpHash;
      }

      if (wait !== undefined) {
        localVarQueryParameter["wait"] = wait;
      }

      localVarUrlObj.query = Object.assign(
        {},
        localVarUrlObj.query,
        localVarQueryParameter,
        options.query
      );
      // fix override query string Detail: https://stackoverflow.com/a/7517673/1077943
      localVarUrlObj.search = null;
      localVarRequestOptions.headers = Object.assign(
        {},
        localVarHeaderParameter,
        options.headers
      );

      return {
        url: url.format(localVarUrlObj),
        options: localVarRequestOptions,
      };
    },
    /**
     * Get solver operations for a user operation previously submitted
     * @summary Get solver operations for a user operation previously submitted
     * @param {any} userOpHash The hash of the user operation
     * @param {any} [wait] Hold the request until having a response
     * @param {*} [options] Override http request option.
     * @throws {RequiredError}
     */
    getSolverOperations(
      userOpHash: any,
      wait?: any,
      options: any = {}
    ): FetchArgs {
      // verify required parameter 'userOpHash' is not null or undefined
      if (userOpHash === null || userOpHash === undefined) {
        throw new RequiredError(
          "userOpHash",
          "Required parameter userOpHash was null or undefined when calling solverOperations."
        );
      }
      const localVarPath = "/solverOperations";
      const localVarUrlObj = url.parse(localVarPath, true);
      const localVarRequestOptions = Object.assign({ method: "GET" }, options);
      const localVarHeaderParameter = {} as any;
      const localVarQueryParameter = {} as any;

      if (userOpHash !== undefined) {
        localVarQueryParameter["userOpHash"] = userOpHash;
      }

      if (wait !== undefined) {
        localVarQueryParameter["wait"] = wait;
      }

      localVarUrlObj.query = Object.assign(
        {},
        localVarUrlObj.query,
        localVarQueryParameter,
        options.query
      );
      // fix override query string Detail: https://stackoverflow.com/a/7517673/1077943
      localVarUrlObj.search = null;
      localVarRequestOptions.headers = Object.assign(
        {},
        localVarHeaderParameter,
        options.headers
      );

      return {
        url: url.format(localVarUrlObj),
        options: localVarRequestOptions,
      };
    },
    /**
     * Submit user/solvers/dApp operations to the relay for bundling
     * @summary Submit a bundle of user/solvers/dApp operations to the relay
     * @param {Bundle} [body] The user/solvers/dApp operations to be bundled
     * @param {*} [options] Override http request option.
     * @throws {RequiredError}
     */
    submitBundle(bundle: Bundle, options: any = {}): FetchArgs {
      const bundleStruct = {
        userOperation: bundle.userOperation.toStruct(),
        solverOperations: bundle.solverOperations.map((op) => op.toStruct()),
        dAppOperation: bundle.dAppOperation.toStruct(),
      };
      const localVarPath = "/bundleOperations";
      const localVarUrlObj = url.parse(localVarPath, true);
      const localVarRequestOptions = Object.assign({ method: "POST" }, options);
      const localVarHeaderParameter = {} as any;
      const localVarQueryParameter = {} as any;

      localVarHeaderParameter["Content-Type"] = "application/json";

      localVarUrlObj.query = Object.assign(
        {},
        localVarUrlObj.query,
        localVarQueryParameter,
        options.query
      );
      // fix override query string Detail: https://stackoverflow.com/a/7517673/1077943
      localVarUrlObj.search = null;
      localVarRequestOptions.headers = Object.assign(
        {},
        localVarHeaderParameter,
        options.headers
      );
      const needsSerialization =
        <any>"Bundle" !== "string" ||
        localVarRequestOptions.headers["Content-Type"] === "application/json";
      localVarRequestOptions.body = needsSerialization
        ? JSON.stringify(bundleStruct || {}, (_, v) =>
            typeof v === "bigint" ? toQuantity(v) : v
          )
        : bundleStruct || "";

      return {
        url: url.format(localVarUrlObj),
        options: localVarRequestOptions,
      };
    },
    /**
     * Submit a user operation to the relay
     * @summary Submit a user operation to the relay
     * @param {UserOperation} [body] The user operation
     * @param {*} [options] Override http request option.
     * @throws {RequiredError}
     */
    submitUserOperation(userOp: UserOperation, options: any = {}): FetchArgs {
      const userOpStruct = userOp.toStruct();
      const localVarPath = "/userOperation";
      const localVarUrlObj = url.parse(localVarPath, true);
      const localVarRequestOptions = Object.assign({ method: "POST" }, options);
      const localVarHeaderParameter = {} as any;
      const localVarQueryParameter = {} as any;

      localVarHeaderParameter["Content-Type"] = "application/json";

      localVarUrlObj.query = Object.assign(
        {},
        localVarUrlObj.query,
        localVarQueryParameter,
        options.query
      );
      // fix override query string Detail: https://stackoverflow.com/a/7517673/1077943
      localVarUrlObj.search = null;
      localVarRequestOptions.headers = Object.assign(
        {},
        localVarHeaderParameter,
        options.headers
      );
      const needsSerialization =
        <any>"UserOperation" !== "string" ||
        localVarRequestOptions.headers["Content-Type"] === "application/json";
      localVarRequestOptions.body = needsSerialization
        ? JSON.stringify(userOpStruct || {}, (_, v) =>
            typeof v === "bigint" ? toQuantity(v) : v
          )
        : userOpStruct || "";

      return {
        url: url.format(localVarUrlObj),
        options: localVarRequestOptions,
      };
    },
  };
};

export class OperationsRelay {
  constructor(
    protected basePath: string = BASE_PATH,
    protected fetch: FetchAPI = isomorphicFetch
  ) {}

  /**
   * Get the Atlas transaction hash from a previously submitted bundle
   * @summary Get the Atlas transaction hash from a previously submitted bundle
   * @param {any} userOpHash The hash of the user operation
   * @param {any} [wait] Hold the request until having a response
   * @param {*} [options] Override http request option.
   * @throws {RequiredError}
   * @memberof DAppApi
   */
  public async getBundleHash(userOpHash: any, wait?: any, options?: any) {
    const localVarFetchArgs = DAppApiFetchParamCreator().getBundleHash(
      userOpHash,
      wait,
      options
    );
    const response = await fetch(
      this.basePath + localVarFetchArgs.url,
      localVarFetchArgs.options
    );
    if (response.status >= 200 && response.status < 300) {
      return await response.json();
    } else {
      const reponseBody = await response.json();
      throw new Error(reponseBody.message);
    }
  }

  /**
   * Get solver operations for a user operation previously submitted
   * @summary Get solver operations for a user operation previously submitted
   * @param {any} userOpHash The hash of the user operation
   * @param {any} [wait] Hold the request until having a response
   * @param {*} [options] Override http request option.
   * @throws {RequiredError}
   * @memberof DAppApi
   */
  public async getSolverOperations(userOpHash: any, wait?: any, options?: any) {
    const localVarFetchArgs = DAppApiFetchParamCreator().getSolverOperations(
      userOpHash,
      wait,
      options
    );
    const response = await fetch(
      this.basePath + localVarFetchArgs.url,
      localVarFetchArgs.options
    );
    if (response.status >= 200 && response.status < 300) {
      return await response.json();
    } else {
      const reponseBody = await response.json();
      throw new Error(reponseBody.message);
    }
  }

  /**
   * Submit user/solvers/dApp operations to the relay for bundling
   * @summary Submit a bundle of user/solvers/dApp operations to the relay
   * @param {Bundle} [body] The user/solvers/dApp operations to be bundled
   * @param {*} [options] Override http request option.
   * @throws {RequiredError}
   * @memberof DAppApi
   */
  public async submitBundle(bundle: Bundle, options?: any) {
    const localVarFetchArgs = DAppApiFetchParamCreator().submitBundle(
      bundle,
      options
    );
    const response = await fetch(
      this.basePath + localVarFetchArgs.url,
      localVarFetchArgs.options
    );
    if (response.status >= 200 && response.status < 300) {
      return await response.json();
    } else {
      const reponseBody = await response.json();
      throw new Error(reponseBody.message);
    }
  }

  /**
   * Submit a user operation to the relay
   * @summary Submit a user operation to the relay
   * @param {UserOperation} [body] The user operation
   * @param {*} [options] Override http request option.
   * @throws {RequiredError}
   * @memberof DAppApi
   */
  public async submitUserOperation(userOp: UserOperation, options?: any) {
    const localVarFetchArgs = DAppApiFetchParamCreator().submitUserOperation(
      userOp,
      options
    );
    const response = await fetch(
      this.basePath + localVarFetchArgs.url,
      localVarFetchArgs.options
    );
    if (response.status >= 200 && response.status < 300) {
      return await response.json();
    } else {
      console.log(
        "request error",
        this.basePath + localVarFetchArgs.url,
        localVarFetchArgs.options
      );
      const reponseBody = await response.json();
      console.log("response", reponseBody, reponseBody.message);
      throw new Error(reponseBody.message);
    }
  }
}
