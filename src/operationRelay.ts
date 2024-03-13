import { UserOperation, SolverOperations, Bundle } from "./operation";
import isomorphicFetch from "isomorphic-fetch";
import * as url from "url";

const BASE_PATH = "/".replace(/\/+$/, "");

export interface ConfigurationParameters {
  apiKey?: string | ((name: string) => string);
  username?: string;
  password?: string;
  accessToken?: string | ((name: string, scopes?: string[]) => string);
  basePath?: string;
}

export class Configuration {
  apiKey?: string | ((name: string) => string);
  username?: string;
  password?: string;
  accessToken?: string | ((name: string, scopes?: string[]) => string);
  basePath?: string;

  constructor(param: ConfigurationParameters = {}) {
    this.apiKey = param.apiKey;
    this.username = param.username;
    this.password = param.password;
    this.accessToken = param.accessToken;
    this.basePath = param.basePath;
  }
}

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
        throw new RequiredError("userOpHash","Required parameter userOpHash was null or undefined when calling getBundleHash.");
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

      localVarUrlObj.query = Object.assign({}, localVarUrlObj.query, localVarQueryParameter, options.query);
      // fix override query string Detail: https://stackoverflow.com/a/7517673/1077943
      localVarUrlObj.search = null;
      localVarRequestOptions.headers = Object.assign({}, localVarHeaderParameter, options.headers);

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
    solverOperations(userOpHash: any, wait?: any, options: any = {}): FetchArgs {
      // verify required parameter 'userOpHash' is not null or undefined
      if (userOpHash === null || userOpHash === undefined) {
        throw new RequiredError("userOpHash","Required parameter userOpHash was null or undefined when calling solverOperations.");
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

      localVarUrlObj.query = Object.assign({}, localVarUrlObj.query, localVarQueryParameter, options.query);
      // fix override query string Detail: https://stackoverflow.com/a/7517673/1077943
      localVarUrlObj.search = null;
      localVarRequestOptions.headers = Object.assign({}, localVarHeaderParameter, options.headers);

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
    submitAllOperations(body?: Bundle, options: any = {}): FetchArgs {
      const localVarPath = "/bundleOperations";
      const localVarUrlObj = url.parse(localVarPath, true);
      const localVarRequestOptions = Object.assign({ method: "POST" }, options);
      const localVarHeaderParameter = {} as any;
      const localVarQueryParameter = {} as any;

      localVarHeaderParameter["Content-Type"] = "application/json";

      localVarUrlObj.query = Object.assign({}, localVarUrlObj.query, localVarQueryParameter, options.query);
      // fix override query string Detail: https://stackoverflow.com/a/7517673/1077943
      localVarUrlObj.search = null;
      localVarRequestOptions.headers = Object.assign({}, localVarHeaderParameter, options.headers);
      const needsSerialization = (<any>"Bundle" !== "string") || localVarRequestOptions.headers["Content-Type"] === "application/json";
      localVarRequestOptions.body =  needsSerialization ? JSON.stringify(body || {}) : (body || "");

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
    submitUserOperation(body?: UserOperation, options: any = {}): FetchArgs {
      const localVarPath = "/userOperation";
      const localVarUrlObj = url.parse(localVarPath, true);
      const localVarRequestOptions = Object.assign({ method: "POST" }, options);
      const localVarHeaderParameter = {} as any;
      const localVarQueryParameter = {} as any;

      localVarHeaderParameter["Content-Type"] = "application/json";

      localVarUrlObj.query = Object.assign({}, localVarUrlObj.query, localVarQueryParameter, options.query);
      // fix override query string Detail: https://stackoverflow.com/a/7517673/1077943
      localVarUrlObj.search = null;
      localVarRequestOptions.headers = Object.assign({}, localVarHeaderParameter, options.headers);
      const needsSerialization = (<any>"UserOperation" !== "string") || localVarRequestOptions.headers["Content-Type"] === "application/json";
      localVarRequestOptions.body =  needsSerialization ? JSON.stringify(body || {}) : (body || "");

      return {
        url: url.format(localVarUrlObj),
        options: localVarRequestOptions,
      };
    },
  };
};

/**
* DAppApi - functional programming interface
* @export
*/
export const DAppApiFp = function() {
  return {
    /**
       * Get the Atlas transaction hash from a previously submitted bundle
       * @summary Get the Atlas transaction hash from a previously submitted bundle
       * @param {any} userOpHash The hash of the user operation
       * @param {any} [wait] Hold the request until having a response
       * @param {*} [options] Override http request option.
       * @throws {RequiredError}
       */
    getBundleHash(userOpHash: any, wait?: any, options?: any): (fetch?: FetchAPI, basePath?: string) => Promise<any> {
      const localVarFetchArgs = DAppApiFetchParamCreator().getBundleHash(userOpHash, wait, options);
      return (fetch: FetchAPI = isomorphicFetch, basePath: string = BASE_PATH) => {
        return fetch(basePath + localVarFetchArgs.url, localVarFetchArgs.options).then((response) => {
          if (response.status >= 200 && response.status < 300) {
            return response.json();
          } else {
            throw response;
          }
        });
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
    solverOperations(userOpHash: any, wait?: any, options?: any): (fetch?: FetchAPI, basePath?: string) => Promise<SolverOperations> {
      const localVarFetchArgs = DAppApiFetchParamCreator().solverOperations(userOpHash, wait, options);
      return (fetch: FetchAPI = isomorphicFetch, basePath: string = BASE_PATH) => {
        return fetch(basePath + localVarFetchArgs.url, localVarFetchArgs.options).then((response) => {
          if (response.status >= 200 && response.status < 300) {
            return response.json();
          } else {
            throw response;
          }
        });
      };
    },
    /**
       * Submit user/solvers/dApp operations to the relay for bundling
       * @summary Submit a bundle of user/solvers/dApp operations to the relay
       * @param {Bundle} [body] The user/solvers/dApp operations to be bundled
       * @param {*} [options] Override http request option.
       * @throws {RequiredError}
       */
    submitAllOperations(body?: Bundle, options?: any): (fetch?: FetchAPI, basePath?: string) => Promise<any> {
      const localVarFetchArgs = DAppApiFetchParamCreator().submitAllOperations(body, options);
      return (fetch: FetchAPI = isomorphicFetch, basePath: string = BASE_PATH) => {
        return fetch(basePath + localVarFetchArgs.url, localVarFetchArgs.options).then((response) => {
          if (response.status >= 200 && response.status < 300) {
            return response.json();
          } else {
            throw response;
          }
        });
      };
    },
    /**
       * Submit a user operation to the relay
       * @summary Submit a user operation to the relay
       * @param {UserOperation} [body] The user operation
       * @param {*} [options] Override http request option.
       * @throws {RequiredError}
       */
    submitUserOperation(body?: UserOperation, options?: any): (fetch?: FetchAPI, basePath?: string) => Promise<any> {
      const localVarFetchArgs = DAppApiFetchParamCreator().submitUserOperation(body, options);
      return (fetch: FetchAPI = isomorphicFetch, basePath: string = BASE_PATH) => {
        return fetch(basePath + localVarFetchArgs.url, localVarFetchArgs.options).then((response) => {
          if (response.status >= 200 && response.status < 300) {
            return response.json();
          } else {
            throw response;
          }
        });
      };
    },
  };
};


export class OperationsRelay {
  protected configuration!: Configuration;

  constructor(configuration?: Configuration, protected basePath: string = BASE_PATH, protected fetch: FetchAPI = isomorphicFetch) {
    if (configuration) {
      this.configuration = configuration;
      this.basePath = configuration.basePath || this.basePath;
    }
  }

  /**
   * Get the Atlas transaction hash from a previously submitted bundle
   * @summary Get the Atlas transaction hash from a previously submitted bundle
   * @param {any} userOpHash The hash of the user operation
   * @param {any} [wait] Hold the request until having a response
   * @param {*} [options] Override http request option.
   * @throws {RequiredError}
   * @memberof DAppApi
   */
  public getBundleHash(userOpHash: any, wait?: any, options?: any) {
    return DAppApiFp(this.configuration).getBundleHash(userOpHash, wait, options)(this.fetch, this.basePath);
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
  public solverOperations(userOpHash: any, wait?: any, options?: any) {
    return DAppApiFp(this.configuration).solverOperations(userOpHash, wait, options)(this.fetch, this.basePath);
  }

  /**
   * Submit user/solvers/dApp operations to the relay for bundling
   * @summary Submit a bundle of user/solvers/dApp operations to the relay
   * @param {Bundle} [body] The user/solvers/dApp operations to be bundled
   * @param {*} [options] Override http request option.
   * @throws {RequiredError}
   * @memberof DAppApi
   */
  public submitAllOperations(body?: Bundle, options?: any) {
    return DAppApiFp(this.configuration).submitAllOperations(body, options)(this.fetch, this.basePath);
  }

  /**
   * Submit a user operation to the relay
   * @summary Submit a user operation to the relay
   * @param {UserOperation} [body] The user operation
   * @param {*} [options] Override http request option.
   * @throws {RequiredError}
   * @memberof DAppApi
   */
  public submitUserOperation(body?: UserOperation, options?: any) {
    return DAppApiFp(this.configuration).submitUserOperation(body, options)(this.fetch, this.basePath);
  }

}