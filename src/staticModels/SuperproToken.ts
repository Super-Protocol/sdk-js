import { Contract, ContractAbi, Transaction } from 'web3';
import rootLogger from '../logger';
import { abi } from '../contracts/abi';
import store from '../store';
import { checkIfActionAccountInitialized } from '../utils/helper';
import { TransactionOptions, BlockInfo } from '../types';
import { EventLog } from 'web3-eth-contract';
import TxManager from '../utils/TxManager';

class SuperproToken {
    private static _addressHttps: string;
    private static _addressWss: string;
    private static contractHttps?: Contract<typeof abi>;
    private static contractWss?: Contract<typeof abi>;
    private static readonly logger = rootLogger.child({ className: 'SuperproToken' });

    public static get addressHttps(): string {
        return SuperproToken._addressHttps;
    }

    public static set addressHttps(newAddress: string) {
        SuperproToken._addressHttps = newAddress;
        SuperproToken.contractHttps = new store.web3Https!.eth.Contract(abi, newAddress, {
            provider: store.web3Https!.currentProvider,
            config: { contractDataInputFill: 'data' },
        });
    }

    public static get addressWss(): string {
        return SuperproToken._addressWss;
    }

    public static set addressWss(newAddress: string) {
        SuperproToken._addressWss = newAddress;
        SuperproToken.contractWss = new store.web3Wss!.eth.Contract(abi, newAddress, {
            provider: store.web3Wss!.currentProvider,
            config: { contractDataInputFill: 'data' },
        });
    }

    /**
     * Checks if contract has been initialized, if not - initialize contract
     */
    private static checkInit(): Contract<typeof abi> {
        if (!SuperproToken.contractHttps) {
            throw Error(`SuperproToken must be initialized before it can be used`);
        }

        return SuperproToken.contractHttps!;
    }

    /**
     * Checks if contract has been initialized with socket support
     */
    private static checkWssInit(): Contract<ContractAbi> {
        return SuperproToken.contractWss!;
    }

    /**
     * Fetching balance of SuperProtocol tokens on address
     */
    public static balanceOf(address: string): Promise<bigint> {
        this.checkInit();

        return this.contractHttps!.methods.balanceOf(address).call();
    }

    /**
     * Fetching allowance of SuperProtocol tokens on address
     */
    public static allowance(from: string, to: string): Promise<bigint> {
        this.checkInit();

        return this.contractHttps!.methods.allowance(from, to).call();
    }

    /**
     * Transfers specific amount of SP tokens to specific address
     * @param to - address to revive tokens
     * @param amount - amount of tokens to transfer
     * @param transactionOptions - object what contains alternative action account or gas limit (optional)
     */
    public static async transfer(
        to: string,
        amount: bigint,
        transactionOptions?: TransactionOptions,
        checkTxBeforeSend = false,
    ): Promise<Transaction> {
        const contract = this.checkInit();
        checkIfActionAccountInitialized(transactionOptions);

        if (checkTxBeforeSend) {
            await TxManager.dryRun(contract.methods.transfer(to, amount), transactionOptions);
        }

        const receipt = await TxManager.execute(
            contract.methods.transfer(to, amount),
            transactionOptions,
            SuperproToken.addressHttps,
        );

        return store.web3Https!.eth.getTransaction(receipt.transactionHash);
    }

    /**
     * Approve tokens for specific address
     * @param address - address for approval
     * @param amount - number of tokens to be approved
     * @param transactionOptions - object what contains alternative action account or gas limit (optional)
     */
    public static async approve(
        address: string,
        amount: bigint,
        transactionOptions?: TransactionOptions,
        checkTxBeforeSend = false,
    ): Promise<void> {
        const contract = this.checkInit();
        checkIfActionAccountInitialized(transactionOptions);

        if (checkTxBeforeSend) {
            await TxManager.dryRun(contract.methods.approve(address, amount), transactionOptions);
        }

        await TxManager.execute(
            contract.methods.approve(address, amount),
            transactionOptions,
            SuperproToken.addressHttps,
        );
    }

    public static onTokenApprove(
        callback: onTokenApproveCallback,
        owner?: string,
        spender?: string,
    ): () => void {
        const contract = this.checkWssInit();
        const logger = this.logger.child({ method: 'onTokenApprove' });

        const subscription = contract.events.Approval();
        subscription.on('data', (event: EventLog): void => {
            if (owner && event.returnValues.owner != owner) {
                return;
            }
            if (spender && event.returnValues.spender != spender) {
                return;
            }
            callback(
                <string>event.returnValues.owner,
                <string>event.returnValues.spender,
                <bigint>event.returnValues.value,
                {
                    index: <bigint>event.blockNumber,
                    hash: <string>event.blockHash,
                },
            );
        });
        subscription.on('error', (error: Error) => {
            logger.warn(error);
        });

        return () => subscription.unsubscribe();
    }

    public static onTokenTransfer(
        callback: onTokenTransferCallback,
        from?: string,
        to?: string,
    ): () => void {
        const contract = this.checkWssInit();
        const logger = this.logger.child({ method: 'onTokenTransfer' });

        const subscription = contract.events.Approval();
        subscription.on('data', (event: EventLog): void => {
            if (from && event.returnValues.from != from) {
                return;
            }
            if (to && event.returnValues.to != to) {
                return;
            }
            callback(
                <string>event.returnValues.from,
                <string>event.returnValues.to,
                <bigint>event.returnValues.value,
                {
                    index: <bigint>event.blockNumber,
                    hash: <string>event.blockHash,
                },
            );
        });
        subscription.on('error', (error: Error) => {
            logger.warn(error);
        });

        return () => subscription.unsubscribe();
    }
}

export type onTokenApproveCallback = (
    owner: string,
    spender: string,
    value: bigint,
    block?: BlockInfo,
) => void;
export type onTokenTransferCallback = (
    from: string,
    to: string,
    value: bigint,
    block?: BlockInfo,
) => void;

export default SuperproToken;
