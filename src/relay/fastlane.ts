import { OperationsRelay } from "./interface";
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

const BASE_PATH = "/".replace(/\/+$/, "");

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

export class FastlaneOperationsRelay implements OperationsRelay {
  constructor(
    protected basePath: string = BASE_PATH,
    protected fetch: FetchAPI = isomorphicFetch
  ) {}

  /**
   * Submit a user operation to the relay
   * @summary Submit a user operation to the relay
   * @param {UserOperation} [userOp] The user operation
   * @param {string[]} [hints] Hints for solvers
   * @param {*} [options] Override http request option.
   */
  public async submitUserOperation(
    userOp: UserOperation,
    hints: string[],
    options?: any
  ): Promise<string> {
    const localVarFetchArgs =
      FastlaneApiFetchParamCreator().submitUserOperation(
        userOp,
        hints,
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

  /**
   * Get solver operations for a user operation previously submitted
   * @summary Get solver operations for a user operation previously submitted
   * @param {string} userOpHash The hash of the user operation
   * @param {boolean} [wait] Hold the request until having a response
   * @param {*} [options] Override http request option.
   */
  public async getSolverOperations(
    userOpHash: string,
    wait?: boolean,
    options?: any
  ): Promise<SolverOperation[]> {
    const localVarFetchArgs =
      FastlaneApiFetchParamCreator().getSolverOperations(
        userOpHash,
        wait,
        options
      );
    const response = await fetch(
      this.basePath + localVarFetchArgs.url,
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
   * Submit user/solvers/dApp operations to the relay for bundling
   * @summary Submit a bundle of user/solvers/dApp operations to the relay
   * @param {Bundle} [bundle] The user/solvers/dApp operations to be bundled
   * @param {*} [options] Override http request option.
   */
  public async submitBundle(bundle: Bundle, options?: any): Promise<string> {
    const localVarFetchArgs = FastlaneApiFetchParamCreator().submitBundle(
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
   * Get the Atlas transaction hash from a previously submitted bundle
   * @summary Get the Atlas transaction hash from a previously submitted bundle
   * @param {string} userOpHash The hash of the user operation
   * @param {boolean} [wait] Hold the request until having a response
   * @param {*} [options] Override http request option.
   */
  public async getBundleHash(
    userOpHash: string,
    wait?: boolean,
    options?: any
  ): Promise<string> {
    const localVarFetchArgs = FastlaneApiFetchParamCreator().getBundleHash(
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
}

const FastlaneApiFetchParamCreator = function () {
  return {
    /**
     * Submit a user operation to the relay
     * @summary Submit a user operation to the relay
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
  };
};
