import { BaseBackend } from "./base";
import { OperationBuilder, ZeroBytes } from "../operation/builder";
import { UserOperation, Bundle } from "../operation";
import { JsonRpcProvider, toQuantity, TypedDataDomain } from "ethers";
import { AtlasVersion, chainConfig } from "../config";

const atlasAuctionMethod = "atlas_auction";

export class FastlaneBackend extends BaseBackend {
  private rpcClient: JsonRpcProvider;

  constructor(params: { [k: string]: string }) {
    super(params);
    this.rpcClient = new JsonRpcProvider(params["endpoint"], 0, {staticNetwork:true});
  }

  public async _submitUserOperation(
    chainId: number,
    atlasVersion: AtlasVersion,
    userOp: UserOperation,
    hints: string[],
    extra?: any,
  ): Promise<string[] | Bundle> {
    const userOperationWithHints = JSON.stringify({
      chainId: toQuantity(chainId),
      userOperation: userOp.toStruct(),
      hints: hints,
    });

    const params: {
      [key: string]: any;
    } = {
      userOperationWithHints: "0x" + Buffer.from(userOperationWithHints).toString("hex"),
      ...extra,
    };

    const response = await this.rpcClient.send(atlasAuctionMethod, [params]);

      if (Array.isArray(response)) {
        return response as string[];
      } else {
        const eip712Domain = (await chainConfig(chainId, atlasVersion)).eip712Domain;
        return validateBundleData(response, eip712Domain, userOp.getField("signature").value !== ZeroBytes);
      }
  }
}

/**
 * Validates the response data by attempting to construct and validate a Bundle instance.
 * @param data The response data to validate.
 * @param tdDomain The TypedDataDomain used for validation.
 * @param validateUserOpSignature Whether to validate the user operation signature.
 * @returns The validated Bundle instance if valid.
 * @throws An error if validation fails.
 */
export const validateBundleData = (
  data: any,
  tdDomain: TypedDataDomain,
  validateUserOpSignature: boolean = true,
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
    bundle.validate(tdDomain, validateUserOpSignature);

    return bundle;
  } catch (error: any) {
    throw new Error(`Invalid bundle data: ${error.message}`);
  }
};
