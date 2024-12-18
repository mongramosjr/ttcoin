import { Address, beginCell, Cell, Contract, contractAddress, ContractProvider, Sender, SendMode } from "@ton/core";

export type TokenContractConfig = {
    number: number;
    address: Address;
};

export function tokenContractConfigToCell(config: TokenContractConfig): Cell {
    return beginCell().storeUint(config.number, 32).storeAddress(config.address).endCell();
}

export class TokenContract implements Contract {
    constructor(
        readonly address: Address,
        readonly init?: { code: Cell; data: Cell }
    ) {}

    static createFromConfig(
        config: TokenContractConfig,
        code: Cell,
        workchain = 0
    ) {
        const data = tokenContractConfigToCell(config);
        const init = { code, data };
        const address = contractAddress(workchain, init);

        return new TokenContract(address, init);
    }

    async sendIncrement(
        provider: ContractProvider,
        sender: Sender,
        value: bigint,
        increment_by: number
    ) {

        const msg_body = beginCell()
            .storeUint(1, 32) // OP code
            .storeUint(increment_by, 32) // increment_by value
            .endCell();

        await provider.internal(sender, {
            value,
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: msg_body,
        });
    }

    async getData(provider: ContractProvider) {
        const { stack } = await provider.get("get_contract_storage_data", []);
        return {
            number: stack.readNumber(),
            recent_sender: stack.readAddress(),
        };
    }

    async getSum(provider: ContractProvider) {
        const {stack} = await provider.get("get_sum", []);
        return {
            sum_data: stack.readNumber(),
        }
    }

    async getLatestSender(provider: ContractProvider) {
        const {stack} = await provider.get("get_the_latest_sender", []);
        return {
            latest_sender: stack.readAddress(),
        }
    }
}


