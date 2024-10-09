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
  [
    "getBundleForUserOp",
    {
      method: "POST",
      path: "/bundle",
    },
  ],
]);

export class FastlaneBackend extends BaseBackend {
  protected fetch: FetchAPI = isomorphicFetch;

  constructor(params: { [k: string]: string }) {
    super(params);
  }

  public async _submitUserOperation(
    chainId: number,
    userOp: UserOperation,
    hints: string[],
    extra?: any,
  ): Promise<string> {
    const localVarFetchArgs =
      FastlaneApiFetchParamCreator().submitUserOperation(
        chainId,
        userOp,
        hints,
        extra,
      );
    const response = await fetch(
      this.params["basePath"] + localVarFetchArgs.url,
      localVarFetchArgs.options,
    );
    if (response.status >= 200 && response.status < 300) {
      return await response.json();
    } else {
      const reponseBody = await response.json();
      throw new Error(reponseBody.message);
    }
  }

  public async _getSolverOperations(
    chainId: number,
    userOp: UserOperation,
    userOpHash: string,
    wait?: boolean,
    extra?: any,
  ): Promise<SolverOperation[]> {
    const localVarFetchArgs =
      FastlaneApiFetchParamCreator().getSolverOperations(
        chainId,
        userOpHash,
        wait,
        extra,
      );
    const response = await fetch(
      this.params["basePath"] + localVarFetchArgs.url,
      localVarFetchArgs.options,
    );
    if (response.status >= 200 && response.status < 300) {
      const solverOpsWithScore = await response.json();
      return solverOpsWithScore.map((solverOpWithScore: any) =>
        OperationBuilder.newSolverOperation(
          solverOpWithScore.solverOperation,
          solverOpWithScore.score,
        ),
      );
    } else {
      const reponseBody = await response.json();
      throw new Error(reponseBody.message);
    }
  }

  public async _submitBundle(
    chainId: number,
    bundle: Bundle,
    extra?: any,
  ): Promise<string> {
    const localVarFetchArgs = FastlaneApiFetchParamCreator().submitBundle(
      chainId,
      bundle,
      extra,
    );
    const response = await fetch(
      this.params["basePath"] + localVarFetchArgs.url,
      localVarFetchArgs.options,
    );
    if (response.status >= 200 && response.status < 300) {
      return await response.json();
    } else {
      const reponseBody = await response.json();
      throw new Error(reponseBody.message);
    }
  }

  public async _getBundleHash(
    chainId: number,
    userOpHash: string,
    wait?: boolean,
    extra?: any,
  ): Promise<string> {
    const localVarFetchArgs = FastlaneApiFetchParamCreator().getBundleHash(
      chainId,
      userOpHash,
      wait,
      extra,
    );
    const response = await fetch(
      this.params["basePath"] + localVarFetchArgs.url,
      localVarFetchArgs.options,
    );
    if (response.status >= 200 && response.status < 300) {
      return await response.json();
    } else {
      const reponseBody = await response.json();
      throw new Error(reponseBody.message);
    }
  }

  public async _getBundleForUserOp(
    chainId: number,
    userOp: UserOperation,
    hints: string[],
    wait?: boolean,
    extra?: any,
  ): Promise<Bundle> {
    const localVarFetchArgs = FastlaneApiFetchParamCreator().getBundleForUserOp(
      chainId,
      userOp,
      hints,
      wait,
      extra,
    );
    const response = await fetch(
      this.params["basePath"] + localVarFetchArgs.url,
      localVarFetchArgs.options,
    );
    if (response.status >= 200 && response.status < 300) {
      const bundleData = await response.json();
      return OperationBuilder.newBundle(
        chainId,
        OperationBuilder.newUserOperation(bundleData.userOperation),
        bundleData.solverOperations.map((op: any) =>
          OperationBuilder.newSolverOperation(op),
        ),
        OperationBuilder.newDAppOperation(bundleData.dAppOperation),
      );
    } else {
      const responseBody = await response.json();
      throw new Error(responseBody.message);
    }
  }
}

const FastlaneApiFetchParamCreator = function () {
  return {
    submitUserOperation(
      chainId: number,
      userOp: UserOperation,
      hints: string[],
      options: any = {},
    ): FetchArgs {
      const body: any = {
        userOperation: userOp.toStruct(),
      };
      if (hints.length > 0) {
        body["hints"] = hints;
      }
      const localVarUrlObj = url.parse(
        ROUTES.get("submitUserOperation")?.path as string,
        true,
      );
      const localVarRequestOptions = Object.assign(
        { method: ROUTES.get("submitUserOperation")?.method as string },
        options,
      );
      const localVarHeaderParameter = {} as any;
      const localVarQueryParameter = {} as any;

      localVarHeaderParameter["Content-Type"] = "application/json";

      localVarUrlObj.query = Object.assign(
        {},
        localVarUrlObj.query,
        localVarQueryParameter,
        options.query,
      );
      // fix override query string Detail: https://stackoverflow.com/a/7517673/1077943
      localVarUrlObj.search = null;
      localVarRequestOptions.headers = Object.assign(
        {},
        localVarHeaderParameter,
        options.headers,
      );
      const needsSerialization =
        <any>"UserOperation" !== "string" ||
        localVarRequestOptions.headers["Content-Type"] === "application/json";
      localVarRequestOptions.body = needsSerialization
        ? JSON.stringify(body || {}, (_, v) =>
            typeof v === "bigint" ? toQuantity(v) : v,
          )
        : body || "";

      return {
        url: url.format(localVarUrlObj),
        options: localVarRequestOptions,
      };
    },
    getSolverOperations(
      chainId: number,
      userOpHash: string,
      wait?: boolean,
      options: any = {},
    ): FetchArgs {
      // verify required parameter 'userOpHash' is not null or undefined
      if (userOpHash === null || userOpHash === undefined) {
        throw "Required parameter userOpHash was null or undefined when calling solverOperations.";
      }
      const localVarUrlObj = url.parse(
        ROUTES.get("getSolverOperations")?.path as string,
        true,
      );
      const localVarRequestOptions = Object.assign(
        { method: ROUTES.get("getSolverOperations")?.method as string },
        options,
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
        options.query,
      );
      // fix override query string Detail: https://stackoverflow.com/a/7517673/1077943
      localVarUrlObj.search = null;
      localVarRequestOptions.headers = Object.assign(
        {},
        localVarHeaderParameter,
        options.headers,
      );

      return {
        url: url.format(localVarUrlObj),
        options: localVarRequestOptions,
      };
    },
    submitBundle(
      chainId: number,
      bundle: Bundle,
      options: any = {},
    ): FetchArgs {
      const bundleStruct = {
        userOperation: bundle.userOperation.toStruct(),
        solverOperations: bundle.solverOperations.map((op) => op.toStruct()),
        dAppOperation: bundle.dAppOperation.toStruct(),
      };
      const localVarUrlObj = url.parse(
        ROUTES.get("submitBundle")?.path as string,
        true,
      );
      const localVarRequestOptions = Object.assign(
        { method: ROUTES.get("submitBundle")?.method as string },
        options,
      );
      const localVarHeaderParameter = {} as any;
      const localVarQueryParameter = {} as any;

      localVarHeaderParameter["Content-Type"] = "application/json";

      localVarUrlObj.query = Object.assign(
        {},
        localVarUrlObj.query,
        localVarQueryParameter,
        options.query,
      );
      // fix override query string Detail: https://stackoverflow.com/a/7517673/1077943
      localVarUrlObj.search = null;
      localVarRequestOptions.headers = Object.assign(
        {},
        localVarHeaderParameter,
        options.headers,
      );
      const needsSerialization =
        <any>"Bundle" !== "string" ||
        localVarRequestOptions.headers["Content-Type"] === "application/json";
      localVarRequestOptions.body = needsSerialization
        ? JSON.stringify(bundleStruct || {}, (_, v) =>
            typeof v === "bigint" ? toQuantity(v) : v,
          )
        : bundleStruct || "";

      return {
        url: url.format(localVarUrlObj),
        options: localVarRequestOptions,
      };
    },
    getBundleHash(
      chainId: number,
      userOpHash: string,
      wait?: boolean,
      options: any = {},
    ): FetchArgs {
      // verify required parameter 'userOpHash' is not null or undefined
      if (userOpHash === null || userOpHash === undefined) {
        throw "Required parameter userOpHash was null or undefined when calling getBundleHash.";
      }
      const localVarUrlObj = url.parse(
        ROUTES.get("getBundleHash")?.path as string,
        true,
      );
      const localVarRequestOptions = Object.assign(
        { method: ROUTES.get("getBundleHash")?.method as string },
        options,
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
        options.query,
      );
      // fix override query string Detail: https://stackoverflow.com/a/7517673/1077943
      localVarUrlObj.search = null;
      localVarRequestOptions.headers = Object.assign(
        {},
        localVarHeaderParameter,
        options.headers,
      );

      return {
        url: url.format(localVarUrlObj),
        options: localVarRequestOptions,
      };
    },
    getBundleForUserOp(
      chainId: number,
      userOp: UserOperation,
      hints: string[],
      wait?: boolean,
      options: any = {},
    ): FetchArgs {
      if (userOp === null || userOp === undefined) {
        throw "Required parameter userOp was null or undefined when calling getBundle.";
      }
      const localVarUrlObj = url.parse(
        ROUTES.get("getBundleForUserOp")?.path as string,
        true,
      );
      const localVarRequestOptions = Object.assign(
        { method: ROUTES.get("getBundleForUserOp")?.method as string },
        options,
      );
      const localVarHeaderParameter = {} as any;
      const localVarQueryParameter = {} as any;

      localVarHeaderParameter["Content-Type"] = "application/json";

      if (wait !== undefined) {
        localVarQueryParameter["wait"] = wait;
      }

      localVarUrlObj.query = Object.assign(
        {},
        localVarUrlObj.query,
        localVarQueryParameter,
        options.query,
      );
      localVarUrlObj.search = null;
      localVarRequestOptions.headers = Object.assign(
        {},
        localVarHeaderParameter,
        options.headers,
      );

      const requestBody = {
        userOperation: userOp.toStruct(),
        hints: hints,
      };

      localVarRequestOptions.body = JSON.stringify(requestBody, (_, v) =>
        typeof v === "bigint" ? toQuantity(v) : v,
      );

      return {
        url: url.format(localVarUrlObj),
        options: localVarRequestOptions,
      };
    },
  };
};
