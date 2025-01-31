# A2FSignatories

This repository contains the Hardhat project for the af2signatories smart contract along with a sample test. The smart contract is designed based on the research paper: https://doi.org/10.1007/s10207-024-00818-y.

## Abstract

Electronic contract signing requires the design of protocols that guarantee that the exchange is fair. In the past 5 years, we have observed that trusted third parties (TTPs) can be replaced by blockchain. However, none of the analyzed blockchain-based solutions meets the abuse-freeness requirement (established by Garay et al. in 1999), i.e., that neither party has the power to decide whether the protocol terminates or aborts. In this article, we present the first blockchain-based contract signing protocol that meets the abuse-freeness requirement. We analyze the economic impact that the use of blockchain has on the participants of a contract signing, concluding that the solution is both technically feasible and cost effective.

## Prerequisites

### Required
- **Node.js** >=18

### Optional
- **pnpm** >=7.33.7: Alternative package manager to npm.

## Installation

To install the dependencies, run the following command:

```shell
npm install 
```
Alternatively, if you prefer using pnpm, you can install the dependencies by running:

```shell
pnpm install 
```

## How to Use

1. Run `npx hardhat compile` to compile the af2signatories smart contract.
2. Run `npx hardhat test` to run the smart contract test.
