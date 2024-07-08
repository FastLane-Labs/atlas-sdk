import { BaseBackend } from "./base";
import { OperationBuilder } from "../operation/builder";
import { UserOperation, SolverOperation, Bundle } from "../operation";
import { toQuantity } from "ethers";
import isomorphicFetch from "isomorphic-fetch";
import * as url from "url";

interface Route {
  method: string;
  path: string;
}

interface FetchAPI {
  (url: string, init?: any): Promise<Response>;
}

interface FetchArgs {
  url: string;
  options: any;
}

const ROUTES: Map<string, Route> = new Map([
  [
    "submitUserOperation",
    {
      method: "POST",
      path: "/userOperation",
    },
  ],
  [
    "getSolverOperations",
    {
      method: "GET",
      path: "/solverOperations",
    },
  ],
  [
    "submitBundle",
    {
      method: "POST",
      path: "/bundleOperations",
    },
  ],
  [
    "getBundleHash",
    {
      method: "GET",
      path: "/bundleHash",
    },
  ],
]);

export class FastlaneBackend extends BaseBackend {
  protected fetch: FetchAPI = isomorphicFetch;

  constructor(params: { [k: string]: string }) {
    super(params);
  }

  /**
   * Submit a user operation to the backend
   * @summary Submit a user operation to the backend
   * @param {UserOperation} [userOp] The user operation
   * @param {string[]} [hints] Hints for solvers
   * @param {*} [extra] Extra parameters
   * @returns {Promise<string>} The hash of the user operation
   */
  public async _submitUserOperation(
    userOp: UserOperation,
    hints: string[],
    extra?: any
  ): Promise<string> {
    const localVarFetchArgs =
      FastlaneApiFetchParamCreator().submitUserOperation(userOp, hints, extra);
    const response = await fetch(
      this.params["basePath"] + localVarFetchArgs.url,
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
   * @param {UserOperation} [userOp] The user operation
   * @param {string} userOpHash The hash of the user operation
   * @param {boolean} [wait] Hold the request until having a response
   * @param {*} [extra] Extra parameters
   * @returns {Promise<SolverOperation[]>} The solver operations
   */
  public async _getSolverOperations(
    _: UserOperation,
    userOpHash: string,
    wait?: boolean,
    extra?: any
  ): Promise<SolverOperation[]> {
    const localVarFetchArgs =
      FastlaneApiFetchParamCreator().getSolverOperations(
        userOpHash,
        wait,
        extra
      );
    const response = await fetch(
      this.params["basePath"] + localVarFetchArgs.url,
      localVarFetchArgs.options
    );
    if (response.status >= 200 && response.status < 300) {
      const solverOpsWithScore = await response.json();
      return solverOpsWithScore.map((solverOpWithScore: any) =>
        OperationBuilder.newSolverOperation(
          solverOpWithScore.solverOperation,
          solverOpWithScore.score
        )
      );
    } else {
      const reponseBody = await response.json();
      throw new Error(reponseBody.message);
    }
  }

  /**
   * Submit user/solvers/dApp operations to the backend for bundling
   * @summary Submit a bundle of user/solvers/dApp operations to the backend
   * @param {Bundle} [bundle] The user/solvers/dApp operations to be bundled
   * @param {*} [extra] Extra parameters
   * @returns {Promise<string>} The result message
   */
  public async _submitBundle(bundle: Bundle, extra?: any): Promise<string> {
    const localVarFetchArgs = FastlaneApiFetchParamCreator().submitBundle(
      bundle,
      extra
    );
    const response = await fetch(
      this.params["basePath"] + localVarFetchArgs.url,
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
   * Get the Atlas transaction hash from a previously submitted bundle
   * @summary Get the Atlas transaction hash from a previously submitted bundle
   * @param {string} userOpHash The hash of the user operation
   * @param {boolean} [wait] Hold the request until having a response
   * @param {*} [extra] Extra parameters
   * @returns {Promise<string>} The Atlas transaction hash
   */
  public async _getBundleHash(
    userOpHash: string,
    wait?: boolean,
    extra?: any
  ): Promise<string> {
    const localVarFetchArgs = FastlaneApiFetchParamCreator().getBundleHash(
      userOpHash,
      wait,
      extra
    );
    const response = await fetch(
      this.params["basePath"] + localVarFetchArgs.url,
      localVarFetchArgs.options
    );
    if (response.status >= 200 && response.status < 300) {
      return await response.json();
    } else {
      const reponseBody = await response.json();
      throw new Error(reponseBody.message);
    }
  }
}

const FastlaneApiFetchParamCreator = function () {
  return {
    /**
     * Submit a user operation to the backend
     * @summary Submit a user operation to the backend
     * @param {UserOperation} [userOp] The user operation
     * @param {string[]} [hints] Hints for solvers
     * @param {*} [options] Override http request option.
     */
    submitUserOperation(
      userOp: UserOperation,
      hints: string[],
      options: any = {}
    ): FetchArgs {
      let body: any = {
        userOperation: userOp.toStruct(),
      };
      if (hints.length > 0) {
        body["hints"] = hints;
      }
      const localVarUrlObj = url.parse(
        ROUTES.get("submitUserOperation")?.path as string,
        true
      );
      const localVarRequestOptions = Object.assign(
        { method: ROUTES.get("submitUserOperation")?.method as string },
        options
      );
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
        ? JSON.stringify(body || {}, (_, v) =>
            typeof v === "bigint" ? toQuantity(v) : v
          )
        : body || "";

      return {
        url: url.format(localVarUrlObj),
        options: localVarRequestOptions,
      };
    },
    /**
     * Get solver operations for a user operation previously submitted
     * @summary Get solver operations for a user operation previously submitted
     * @param {string} userOpHash The hash of the user operation
     * @param {boolean} [wait] Hold the request until having a response
     * @param {*} [options] Override http request option.
     */
    getSolverOperations(
      userOpHash: string,
      wait?: boolean,
      options: any = {}
    ): FetchArgs {
      // verify required parameter 'userOpHash' is not null or undefined
      if (userOpHash === null || userOpHash === undefined) {
        throw "Required parameter userOpHash was null or undefined when calling solverOperations.";
      }
      const localVarUrlObj = url.parse(
        ROUTES.get("getSolverOperations")?.path as string,
        true
      );
      const localVarRequestOptions = Object.assign(
        { method: ROUTES.get("getSolverOperations")?.method as string },
        options
      );
      const localVarHeaderParameter = {} as any;
      const localVarQueryParameter = {} as any;

      if (userOpHash !== undefined) {
        localVarQueryParameter["operationHash"] = userOpHash;
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
     * Submit user/solvers/dApp operations to the backend for bundling
     * @summary Submit a bundle of user/solvers/dApp operations to the backend
     * @param {Bundle} [bundle] The user/solvers/dApp operations to be bundled
     * @param {*} [options] Override http request option.
     */
    submitBundle(bundle: Bundle, options: any = {}): FetchArgs {
      const bundleStruct = {
        userOperation: bundle.userOperation.toStruct(),
        solverOperations: bundle.solverOperations.map((op) => op.toStruct()),
        dAppOperation: bundle.dAppOperation.toStruct(),
      };
      const localVarUrlObj = url.parse(
        ROUTES.get("submitBundle")?.path as string,
        true
      );
      const localVarRequestOptions = Object.assign(
        { method: ROUTES.get("submitBundle")?.method as string },
        options
      );
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
     * Get the Atlas transaction hash from a previously submitted bundle
     * @summary Get the Atlas transaction hash from a previously submitted bundle
     * @param {string} userOpHash The hash of the user operation
     * @param {boolean} [wait] Hold the request until having a response
     * @param {*} [options] Override http request option.
     */
    getBundleHash(
      userOpHash: string,
      wait?: boolean,
      options: any = {}
    ): FetchArgs {
      // verify required parameter 'userOpHash' is not null or undefined
      if (userOpHash === null || userOpHash === undefined) {
        throw "Required parameter userOpHash was null or undefined when calling getBundleHash.";
      }
      const localVarUrlObj = url.parse(
        ROUTES.get("getBundleHash")?.path as string,
        true
      );
      const localVarRequestOptions = Object.assign(
        { method: ROUTES.get("getBundleHash")?.method as string },
        options
      );
      const localVarHeaderParameter = {} as any;
      const localVarQueryParameter = {} as any;

      if (userOpHash !== undefined) {
        localVarQueryParameter["operationHash"] = userOpHash;
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
  };
};
