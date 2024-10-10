import { BaseBackend } from "./base";
import { OperationBuilder } from "../operation/builder";
import { UserOperation, SolverOperation, Bundle } from "../operation";
import { toQuantity, TypedDataDomain } from "ethers";
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
  protected fetch: typeof fetch = isomorphicFetch;

  constructor(params: { [k: string]: string }) {
    super(params);
  }

  public async _submitUserOperation(
    chainId: number,
    userOp: UserOperation,
    hints: string[],
    extra?: any,
  ): Promise<string> {
    const fetchArgs = FastlaneApiFetchParamCreator().submitUserOperation(
      chainId,
      userOp,
      hints,
      extra,
    );
    const response = await this.fetch(
      this.params["basePath"] + fetchArgs.url,
      fetchArgs.options,
    );
    if (response.ok) {
      const data = await response.json();
      return data as string; // Assuming the response is a string hash
    } else {
      const errorBody = await response.json();
      throw new Error(errorBody.message || "Failed to submit user operation.");
    }
  }

  public async _getSolverOperations(
    chainId: number,
    userOp: UserOperation,
    userOpHash: string,
    wait?: boolean,
    extra?: any,
  ): Promise<SolverOperation[]> {
    const fetchArgs = FastlaneApiFetchParamCreator().getSolverOperations(
      chainId,
      userOpHash,
      wait,
      extra,
    );
    const response = await this.fetch(
      this.params["basePath"] + fetchArgs.url,
      fetchArgs.options,
    );
    if (response.ok) {
      const solverOpsWithScore = await response.json();
      return solverOpsWithScore.map((solverOpWithScore: any) =>
        OperationBuilder.newSolverOperation(
          solverOpWithScore.solverOperation,
          solverOpWithScore.score,
        ),
      );
    } else {
      const errorBody = await response.json();
      throw new Error(errorBody.message || "Failed to get solver operations.");
    }
  }

  public async _submitBundle(
    chainId: number,
    bundle: Bundle,
    extra?: any,
  ): Promise<string> {
    const fetchArgs = FastlaneApiFetchParamCreator().submitBundle(
      chainId,
      bundle,
      extra,
    );
    const response = await this.fetch(
      this.params["basePath"] + fetchArgs.url,
      fetchArgs.options,
    );
    if (response.ok) {
      const data = await response.json();
      return data as string; // Assuming the response is a string message
    } else {
      const errorBody = await response.json();
      throw new Error(errorBody.message || "Failed to submit bundle.");
    }
  }

  public async _getBundleHash(
    chainId: number,
    userOpHash: string,
    wait?: boolean,
    extra?: any,
  ): Promise<string> {
    const fetchArgs = FastlaneApiFetchParamCreator().getBundleHash(
      chainId,
      userOpHash,
      wait,
      extra,
    );
    const response = await this.fetch(
      this.params["basePath"] + fetchArgs.url,
      fetchArgs.options,
    );
    if (response.ok) {
      const data = await response.json();
      return data as string; // Assuming the response is a string hash
    } else {
      const errorBody = await response.json();
      throw new Error(errorBody.message || "Failed to get bundle hash.");
    }
  }

  public async _getBundleForUserOp(
    chainId: number,
    userOp: UserOperation,
    hints: string[],
    wait?: boolean,
    extra?: any,
  ): Promise<Bundle> {
    const fetchArgs = FastlaneApiFetchParamCreator().getBundleForUserOp(
      chainId,
      userOp,
      hints,
      wait,
      extra,
    );
    const response = await this.fetch(
      this.params["basePath"] + fetchArgs.url,
      fetchArgs.options,
    );
    if (response.ok) {
      const bundleData = await response.json();
      const bundle = OperationBuilder.newBundle(
        chainId,
        OperationBuilder.newUserOperation(bundleData.userOperation),
        bundleData.solverOperations.map((op: any) =>
          OperationBuilder.newSolverOperation(op),
        ),
        OperationBuilder.newDAppOperation(bundleData.dAppOperation),
      );
      return bundle;
    } else {
      const errorBody = await response.json();
      throw new Error(
        errorBody.message || "Failed to get bundle for user operation.",
      );
    }
  }
}

class RequestBuilder {
  /**
   * Builds the fetch arguments based on the route key and parameters.
   */
  static buildRequest(
    routeKey: string,
    queryParams: { [key: string]: any } = {},
    body?: any,
  ): FetchArgs {
    const route = ROUTES.get(routeKey);
    if (!route) {
      throw new Error(`Route ${routeKey} is not defined.`);
    }

    // Determine the HTTP method
    const method = route.method;

    // Parse the URL
    const urlObj = url.parse(route.path, true);

    // Assign query parameters
    urlObj.query = { ...urlObj.query, ...queryParams };
    urlObj.search = null; // Reset search to apply new query

    // Set headers
    const headers: HeadersInit = {
      "Content-Type": "application/json",
    };

    // Construct request options
    const options: RequestInit = {
      method,
      headers,
    };

    // Attach body if present and method allows
    if (body && ["POST", "PUT", "PATCH"].includes(method.toUpperCase())) {
      options.body = JSON.stringify(body, (_, value) =>
        typeof value === "bigint" ? toQuantity(value) : value,
      );
    }

    return {
      url: url.format(urlObj),
      options,
    };
  }
}

/**
 * Validates the response data by attempting to construct and validate a Bundle instance.
 * @param data The response data to validate.
 * @param tdDomain The TypedDataDomain used for validation.
 * @returns The validated Bundle instance if valid.
 * @throws An error if validation fails.
 */
export const validateBundleData = (
  data: any,
  tdDomain: TypedDataDomain,
): Bundle => {
  try {
    // Construct the Bundle instance
    const bundle = new Bundle(
      data.chainId,
      OperationBuilder.newUserOperation(data.userOperation),
      data.solverOperations.map((op: any) =>
        OperationBuilder.newSolverOperation(op),
      ),
      OperationBuilder.newDAppOperation(data.dAppOperation),
    );

    // Perform validation
    bundle.validate(tdDomain);

    return bundle;
  } catch (error: any) {
    throw new Error(`Invalid bundle data: ${error.message}`);
  }
};

export const FastlaneApiFetchParamCreator = function () {
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

      const queryParams = {
        chainId: toQuantity(chainId),
        ...options.query,
      };

      return RequestBuilder.buildRequest(
        "submitUserOperation",
        queryParams,
        body,
      );
    },

    getSolverOperations(
      chainId: number,
      userOpHash: string,
      wait?: boolean,
      options: any = {},
    ): FetchArgs {
      if (userOpHash === null || userOpHash === undefined) {
        throw new Error(
          "Required parameter userOpHash was null or undefined when calling getSolverOperations.",
        );
      }

      const queryParams: any = {
        chainId: toQuantity(chainId),
        operationHash: userOpHash,
        ...options.query,
      };

      if (wait !== undefined) {
        queryParams["wait"] = wait;
      }

      return RequestBuilder.buildRequest(
        "getSolverOperations",
        queryParams,
        undefined,
      );
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

      const queryParams = {
        chainId: toQuantity(chainId),
        ...options.query,
      };

      return RequestBuilder.buildRequest(
        "submitBundle",
        queryParams,
        bundleStruct,
      );
    },

    getBundleHash(
      chainId: number,
      userOpHash: string,
      wait?: boolean,
      options: any = {},
    ): FetchArgs {
      if (userOpHash === null || userOpHash === undefined) {
        throw new Error(
          "Required parameter userOpHash was null or undefined when calling getBundleHash.",
        );
      }

      const queryParams: any = {
        chainId: toQuantity(chainId),
        operationHash: userOpHash,
        ...options.query,
      };

      if (wait !== undefined) {
        queryParams["wait"] = wait;
      }

      return RequestBuilder.buildRequest("getBundleHash", queryParams);
    },

    getBundleForUserOp(
      chainId: number,
      userOp: UserOperation,
      hints: string[],
      wait?: boolean,
      options: any = {},
    ): FetchArgs {
      if (userOp === null || userOp === undefined) {
        throw new Error(
          "Required parameter userOp was null or undefined when calling getBundleForUserOp.",
        );
      }

      const body = {
        chainId: toQuantity(chainId),
        userOperation: userOp.toStruct(),
        hints: hints,
      };

      const queryParams: any = {
        wait,
        ...options.query,
      };

      return RequestBuilder.buildRequest(
        "getBundleForUserOp",
        queryParams,
        body,
      );
    },
  };
};
