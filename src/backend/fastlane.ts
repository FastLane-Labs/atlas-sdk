import { BaseBackend } from "./base";
import { OperationBuilder } from "../operation/builder";
import { UserOperation, Bundle } from "../operation";
import { toQuantity, TypedDataDomain } from "ethers";
import { AtlasVersion, chainConfig } from "../config";
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
      path: "/auction",
    },
  ],
  [
    "submitBundle",
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
    atlasVersion: AtlasVersion,
    userOp: UserOperation,
    hints: string[],
    extra?: any,
  ): Promise<string[] | Bundle> {
    const fetchArgs = FastlaneApiFetchParamCreator().submitUserOperation(
      chainId,
      userOp,
      hints,
      extra,
    );
    const response = await this.fetch(
      this.params["endpoint"] + fetchArgs.url,
      fetchArgs.options,
    );
    if (response.ok) {
      const data = await response.json();
      if (Array.isArray(data)) {
        return data as string[];
      } else {
        const eip712Domain = (await chainConfig(chainId, atlasVersion)).eip712Domain;
        return validateBundleData(data, eip712Domain);
      }
    } else {
      const errorBody = await response.json();
      throw new Error(errorBody.message || "Failed to submit user operation.");
    }
  }

  public async _submitBundle(
    chainId: number,
    atlasVersion: AtlasVersion,
    bundle: Bundle,
    extra?: any,
  ): Promise<string[]> {
    const fetchArgs = FastlaneApiFetchParamCreator().submitBundle(
      chainId,
      bundle,
      extra,
    );
    const response = await this.fetch(
      this.params["endpoint"] + fetchArgs.url,
      fetchArgs.options,
    );
    if (response.ok) {
      const data = await response.json();
      return data as string[];
    } else {
      const errorBody = await response.json();
      throw new Error(errorBody.message || "Failed to submit bundle.");
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
      const userOperationWithHints = JSON.stringify({
        chainId: toQuantity(chainId),
        userOperation: userOp.toStruct(),
        hints: hints,
      });
      const body: any = {
        userOperationWithHints: "0x" + Buffer.from(userOperationWithHints).toString("hex"),
        ...options,
      };

      return RequestBuilder.buildRequest(
        "submitUserOperation",
        {},
        body,
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
  };
};
