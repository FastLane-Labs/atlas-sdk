# System Overview

The Atlas SDK acts as the reference implementation for a client within the Atlas ecosystem. We expect most DApps to simply use the SDK to interact with components within the ecosystem.

Advanced clients or clients outside the JS ecosystem may need to interact with components directly via their API, in which case the SDK may instead serve as an example.

## Purpose and Scope

An Atlas Client may need to interact with many different components to submit a Bundle. The SDK contains a client interface for each of these component types, and specific implementations for different providers of each of these components.

The SDK also contains a configurable process manager / orchestrator that helps a consumer use these different components together to execute an Atlas Bundle.

# System Architecture

## Domain Components

A full deployment of Atlas with every domain component looks like this:

![Full component diagram](/docs/components.png "Full component diagram")

| Component        | Description                                                                 |
|------------------|-----------------------------------------------------------------------------|
| AtlasClient      | This is the client application responsible for interacting with Atlas, typically a DApp.    |
| OperationsRelay  | Responsible for the relaying of operations between the client and solvers. |
| Reputation       | Responsible for keeping track of the performance of solvers to help the auctioneer. |
| Auctioneer       | Responsible for determining the order of the solutions in the final bundle.|
| Bundler          | Responsible for constructing the final Bundle that will be sent to the entrypoint contract. |
| AtlasEntrypoint  | Responsible for executing the Atlas bundle on chain.                       |
| RPC              | A blockchain RPC endpoint for making view calls and sending transactions.  |

Practically speaking, the client can also perform the responsibilities of the Auctioneer and Bundler, and the Reputation component is not required for all use cases. This makes the simplest Atlas deployment look like this:

![Simplest component diagram](/docs/components-simplest.png "Simplest component diagram")

In this case, the Bundling and Auctioneer responsibilities are conducted by the SDK inside the client, so no external components are necessary.

## Domain Data Model

The Atlas data model primarily consists of 3 different types of Operations which togehter are combined into a Bundle that is signed into a transaction:

![Data model](/docs/data-model.png "Data model")

| Class        | Description                                                                 |
|------------------|-----------------------------------------------------------------------------|
| UserOperation | User operations take the place of a users transaction within Atlas, and are always executed first in a bundle.  |
| SolverOperation | Solver operations take the place of a solvers transaction within Atlas, and there can be one or more of these. There is only ever one successful solver operation in an Atlas bundle. |
| DAppOperation | The DApp operation contains the hashes of the user operation, and the callChainHash of the SolverOperation, and is what maintains the integrity of an Atlas bundle. |
| Bundle | This is the container that holds all of the operations within an Atlas bundle, and is what is eventually signed as a transaction and sent to the blockchain. |


## Domain Component Interaction

The interaction between the high level components in Atlas using the above model is as follows:

![Component interaction](/docs/component-interaction.png "Component interaction")

1. The AtlasClient sends a UserOperation to the OperationsRelay in order to receive back some SolverOperations
1. The OperationsRelay broadcasts the UserOperation (or some derivative thereof) to any interested solvers
1. The Solvers respond with zero or more SolverOperations
1. The OperationsRelay batches these up and returns them to the AtlasClient once ready
1. The AtlasClient asks the Reputation service to provide a score for each of the SolverOperations
1. The AtlasClient then sends the UserOperation and scored SolverOperations to the Auctioneer orders them and may censor low scoring operations. The Auctioneer produces the DAppOperation to enforce the ordering, and returns all of this to the client.
1. These ordered SolverOperations and the UserOperation are then sent to the bundler for bundling and execution
1. The Bundler created a DAppOperation for this Bundle, created the Bundle all three types of operations, and finally creates a regular transaction from this and signs it.
1. Finally, the Bundler sends this to the AtlasEntrypoint contract via a blockchain RPC of some sort.


## Common Configurations

### Uniswap V2 Backruns

In the Uniswap V2 Backrun configuration, the recommended configuration is that the Atlas Client perform the roles of auctioneer and bundler, meaning only an OperationsRelay is required as an external component. All other components run in the users browser.

#### Components

| Component        | Implementation           |
|------------------|--------------------------|
| AtlasClient      | Users Web Browser / DApp |
| OperationsRelay  | BloxRoute Intent Network |
| Reputation       | Not Necessary            |
| Auctioneer       | SDK                      |
| Bundler          | SDK                      |
| RPC              | Users Wallet             |

#### DAppControl Module

Module Name: `v2-example-router`

#### Process Flow

![Uniswap V2 Process](/docs/uniswap-v2-process.png "Uniswap V2 Process")


### Oracle Extractable Value (OEV)


### Request for Quote (RFQ)


## Data Transformations



# Concrete Implementations

## Clients

### Atlas SDK

## Operations Relay

### BloxRoute BDN

## Reputation

None yet.

## Bundler

### Atlas SDK





