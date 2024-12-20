import { Cell, toNano } from "@ton/core";
import { hex } from "../build/test_token.compiled.json";
// We need to additionally import SandboxContract and TreasuryContract
import { Blockchain, SandboxContract, TreasuryContract } from "@ton/sandbox";
import { TokenContract } from "../wrappers/TokenContract";
import "@ton/test-utils";


describe("test_token.fc contract tests", () => {
    let blockchain: Blockchain;
    let myContract: SandboxContract<TokenContract>;
    let initWallet: SandboxContract<TreasuryContract>;
    let ownerWallet: SandboxContract<TreasuryContract>;

    beforeEach(async () => {
        blockchain = await Blockchain.create();
        initWallet = await blockchain.treasury("initWallet");
        ownerWallet = await blockchain.treasury("ownerWallet");

        const codeCell = Cell.fromBoc(Buffer.from(hex, "hex"))[0];

        myContract = blockchain.openContract(
            TokenContract.createFromConfig(
                {
                    number: 0,
                    init_address: initWallet.address,
                    owner_address: ownerWallet.address,
                },
                codeCell
            )
        );
    });

    it("should successfully increase counter in contract and get the proper most recent sender address", async () => {
        const senderWallet = await blockchain.treasury("sender");

        const sentMessageResult = await myContract.sendIncrement(
            senderWallet.getSender(),
            toNano("0.05"),
            6
        );

        expect(sentMessageResult.transactions).toHaveTransaction({
            from: senderWallet.address,
            to: myContract.address,
            success: true,
        });

        const data = await myContract.getData();

        expect(data.recent_sender.toString()).toBe(senderWallet.address.toString());
        expect(data.number).toEqual(6);

        const sentMessageResult2 = await myContract.sendIncrement(
            senderWallet.getSender(),
            toNano("0.05"),
            1
        );

        const data2 = await myContract.getSum();
        expect(data2.sum_data).toEqual(7);

        const data3 = await myContract.getLatestSender();
        expect(data3.latest_sender.toString()).toBe(senderWallet.address.toString());
    });

    it("should get the proper most recent sender address", async () => {
        const senderWallet = await blockchain.treasury("sender");

        const sentMessageResult = await myContract.sendIncrement(
            senderWallet.getSender(),
            toNano("0.05"),
            1
        );

        expect(sentMessageResult.transactions).toHaveTransaction({
            from: senderWallet.address,
            to: myContract.address,
            success: true,
        });

        const data = await myContract.getData();

        expect(data.recent_sender.toString()).toBe(senderWallet.address.toString());
        expect(data.number).toEqual(1);
    });

    it("successfully deposits funds", async () => {
        const senderWallet = await blockchain.treasury("sender");

        const depositMessageResult = await myContract.sendDeposit(
            senderWallet.getSender(),
            toNano("5")
        );

        expect(depositMessageResult.transactions).toHaveTransaction({
            from: senderWallet.address,
            to: myContract.address,
            success: true,
        });

        const balanceRequest = await myContract.getBalance();

        expect(balanceRequest.balance).toBeGreaterThan(toNano("4.99"));
    });
    it("should return deposit funds as no command is sent", async () => {
        const senderWallet = await blockchain.treasury("sender");

        const depositMessageResult = await myContract.sendNoCodeDeposit(
            senderWallet.getSender(),
            toNano("5")
        );

        expect(depositMessageResult.transactions).toHaveTransaction({
            from: myContract.address,
            to: senderWallet.address,
            success: true,
        });

        const balanceRequest = await myContract.getBalance();

        expect(balanceRequest.balance).toBe(0);
    });
    it("successfully withdraws funds on behalf of owner", async () => {
        const senderWallet = await blockchain.treasury("sender");

        await myContract.sendDeposit(senderWallet.getSender(), toNano("5"));

        const withdrawalRequestResult = await myContract.sendWithdrawalRequest(
            ownerWallet.getSender(),
            toNano("0.05"),
            toNano("1")
        );

        expect(withdrawalRequestResult.transactions).toHaveTransaction({
            from: myContract.address,
            to: ownerWallet.address,
            success: true,
            value: toNano(1),
        });
    });
    it("fails to withdraw funds on behalf of non-owner", async () => {
        const senderWallet = await blockchain.treasury("sender");

        await myContract.sendDeposit(senderWallet.getSender(), toNano("5"));

        const withdrawalRequestResult = await myContract.sendWithdrawalRequest(
            senderWallet.getSender(),
            toNano("0.5"),
            toNano("1")
        );

        expect(withdrawalRequestResult.transactions).toHaveTransaction({
            from: senderWallet.address,
            to: myContract.address,
            success: false,
            exitCode: 103,
        });
    });
    it("fails to withdraw funds because lack of balance", async () => {
        const withdrawalRequestResult = await myContract.sendWithdrawalRequest(
            ownerWallet.getSender(),
            toNano("0.5"),
            toNano("1")
        );

        expect(withdrawalRequestResult.transactions).toHaveTransaction({
            from: ownerWallet.address,
            to: myContract.address,
            success: false,
            exitCode: 104,
        });
    });
});