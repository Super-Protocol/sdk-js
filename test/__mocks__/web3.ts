/* eslint-disable @typescript-eslint/no-explicit-any */

// const web3 = jest.genMockFromModule<typeof import('web3')>('web3');

/* Mock web3-eth-contract */
let mockWeb3EthContract = function (): void {};
function __setMockContract(mock: any): void {
  mockWeb3EthContract = mock;
}

let blockNumber = 0;
function __setBlockNumber(number: number): void {
  blockNumber = number;
}

const txCount = 0;

const eth = {
  Contract: jest.fn().mockImplementation(() => mockWeb3EthContract),
  getBlockNumber: (): number => blockNumber,
  sendSignedTransaction: jest
    .fn()
    .mockImplementation((_signedTransactionData) => Promise.resolve({ status: true })),
  sendTransaction: jest
    .fn()
    .mockImplementation((txConfig) => Promise.resolve({ status: true, from: txConfig.from })),
  getTransactionCount: (): number => txCount,
  accounts: {
    signTransaction: jest
      .fn()
      .mockImplementation((_txData, _privateKey) =>
        Promise.resolve({ rawTransaction: 'rawTransaction' }),
      ),
  },
};

const web3: any = function (provider: any) {
  return {
    provider: provider,
    eth: eth,
  };
};

web3.providers = {
  HttpProvider: function () {
    return {
      send: (_payload: any, cb: any) => {
        cb(null, '{}');
      },
    };
  },
};
web3.__setMockContract = __setMockContract;
web3.__setBlockNumber = __setBlockNumber;
module.exports = web3;
