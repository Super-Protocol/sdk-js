import Web3 from 'web3';
import { TransactionOptions } from '../src/types/Web3';
import TxManager from '../src/utils/TxManager';
import { defaultBlockchainUrl } from '../src/constants';
import store from '../src/store';
import NonceTracker from '../src/utils/NonceTracker';

jest.mock<typeof import('../src/store')>('../src/store');

const mockPrivateKey = '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80';

const mockTxOptions: TransactionOptions = {
    from: '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266',
    gas: BigInt(1000),
    gasPrice: BigInt(1000),
    gasPriceMultiplier: 1,
};

describe('TxManager', () => {
    let web3: Web3;

    beforeEach(() => {
        const provider = new Web3.providers.HttpProvider(defaultBlockchainUrl);
        web3 = new Web3(provider);
        TxManager.init(web3);
    });

    afterEach(() => {
        store.actionAccount = '';
        store.keys = {};
        jest.restoreAllMocks();
        jest.clearAllMocks();
    });

    describe('publishTransaction', () => {
        it('should send unSigned transaction', async () => {
            const txData = {
                to: 'recipient',
                value: BigInt(1000),
            };
            const txOptions = { ...mockTxOptions, web3 };

            const sendSignedTxSpy = jest.spyOn(web3.eth, 'sendSignedTransaction');
            const sendUnsignedTxSpy = jest.spyOn(web3.eth, 'sendTransaction');

            const result = await TxManager.publishTransaction(txData, txOptions);

            const expectedCallArgs = {
                ...txData,
                from: mockTxOptions.from,
                gas: mockTxOptions.gas,
                gasPrice: mockTxOptions.gasPrice,
                gasPriceMultiplier: mockTxOptions.gasPriceMultiplier,
            };
            expect(sendSignedTxSpy).not.toHaveBeenCalled();
            expect(sendUnsignedTxSpy).toHaveBeenCalledTimes(1);
            expect(sendUnsignedTxSpy).toHaveBeenCalledWith(expectedCallArgs);
            expect(result.status).toBe(true);
        });

        it('should send signed transaction', async () => {
            const txData = {
                to: 'recipient',
                value: BigInt(1000),
            };
            store.keys[mockTxOptions.from!] = mockPrivateKey;
            const txOptions = { ...mockTxOptions, web3 };
            const expectedSignTxResult = {
                r: 'r',
                s: 's',
                v: 'v',
                rawTransaction: 'rawTransaction',
            };

            const signTransaction = jest
                .spyOn(web3.eth.accounts, 'signTransaction')
                .mockReturnValue(Promise.resolve(expectedSignTxResult as any));
            const sendSignedTxSpy = jest.spyOn(web3.eth, 'sendSignedTransaction');

            const result = await TxManager.publishTransaction(txData, txOptions);

            const expectedCallArgs = {
                ...txData,
                from: mockTxOptions.from,
                gas: mockTxOptions.gas,
                gasPrice: mockTxOptions.gasPrice,
                gasPriceMultiplier: mockTxOptions.gasPriceMultiplier,
            };

            expect(signTransaction).toHaveBeenCalledTimes(1);
            expect(signTransaction).toHaveBeenCalledWith(expectedCallArgs, mockPrivateKey);
            expect(sendSignedTxSpy).toHaveBeenCalledTimes(1);
            expect(sendSignedTxSpy).toHaveBeenCalledWith(expectedSignTxResult.rawTransaction);
            expect(result.status).toBe(true);
        });

        it('should send transaction using NonceTracker', async () => {
            store.actionAccount = mockTxOptions.from;

            const txData = {
                to: 'recipient',
                value: BigInt(1000),
            };
            const txOptions = { ...mockTxOptions };

            const sendTxSpy = jest.spyOn(web3.eth, 'sendTransaction');

            const expectedNonce = BigInt(1);
            const consumeNonceSpy = jest
                .spyOn(NonceTracker.prototype, 'consumeNonce')
                .mockImplementation(() => expectedNonce);

            const initAccountSpy = jest.spyOn(NonceTracker.prototype, 'initAccount');

            await TxManager.initAccount(mockTxOptions.from!);
            await TxManager.publishTransaction(txData, txOptions);

            const expectedCallArgs = {
                ...txData,
                from: mockTxOptions.from,
                gas: mockTxOptions.gas,
                gasPrice: mockTxOptions.gasPrice,
                gasPriceMultiplier: mockTxOptions.gasPriceMultiplier,
                nonce: expectedNonce,
            };

            expect(initAccountSpy).toHaveBeenCalledTimes(1);
            expect(consumeNonceSpy).toHaveBeenCalledTimes(1);
            expect(sendTxSpy).toHaveBeenCalledTimes(1);
            expect(sendTxSpy).toHaveBeenCalledWith(expectedCallArgs);
        });
    });
});
