import { Blockchain, SandboxContract, TreasuryContract } from '@ton/sandbox';
import {Address, Cell, toNano} from '@ton/core';
import { TokenBlueprint } from '../wrappers/TokenBlueprint';
import '@ton/test-utils';
import { compile } from '@ton/blueprint';

describe('TokenBlueprint', () => {
    let code: Cell;

    beforeAll(async () => {
        code = await compile('TokenBlueprint');
    });

    let blockchain: Blockchain;
    let initWallet: SandboxContract<TreasuryContract>;
    let deployerWallet: SandboxContract<TreasuryContract>;
    let tokenBlueprint: SandboxContract<TokenBlueprint>;

    beforeEach(async () => {
        blockchain = await Blockchain.create();
        initWallet = await blockchain.treasury('initWallet');
        deployerWallet = await blockchain.treasury('deployerWallet');

        tokenBlueprint = blockchain.openContract(
            TokenBlueprint.createFromConfig(
                {
                    id: 0,
                    counter: 0,
                    address: initWallet.address,
                    owner_address: deployerWallet.address,
                },
                code
            )
        );

        const deployResult = await tokenBlueprint.sendDeploy(deployerWallet.getSender(), toNano('0.05'));

        expect(deployResult.transactions).toHaveTransaction({
            from: deployerWallet.address,
            to: tokenBlueprint.address,
            deploy: true,
            success: true,
        });
    });

    it('should deploy', async () => {
        // the check is done inside beforeEach
        // blockchain and tokenBlueprint are ready to use
    });

    it('should increase counter', async () => {
        const increaseTimes = 3;
        for (let i = 0; i < increaseTimes; i++) {
            console.log(`increase ${i + 1}/${increaseTimes}`);

            const increaser = await blockchain.treasury('increaser' + i);

            const counterBefore = await tokenBlueprint.getCounter();

            console.log('counter before increasing', counterBefore);

            const increaseBy = Math.floor(Math.random() * 100);

            console.log('increasing by', increaseBy);

            const increaseResult = await tokenBlueprint.sendIncrease(increaser.getSender(), {
                increaseBy,
                value: toNano('0.05'),
            });

            expect(increaseResult.transactions).toHaveTransaction({
                from: increaser.address,
                to: tokenBlueprint.address,
                success: true,
            });

            const counterAfter = await tokenBlueprint.getCounter();

            console.log('counter after increasing', counterAfter);

            expect(counterAfter).toBe(counterBefore + increaseBy);
        }
    });

    it("successfully deposits funds", async () => {

        const balanceRequest_old = await tokenBlueprint.getBalance();

        console.log('balance is ', balanceRequest_old.number);
        console.log(' deposit amount is ', toNano("5"))

        const senderWallet = await blockchain.treasury("sender");

        const depositMessageResult = await tokenBlueprint.sendDeposit(
            senderWallet.getSender(),
            toNano("5")
        );

        expect(depositMessageResult.transactions).toHaveTransaction({
            from: senderWallet.address,
            to: tokenBlueprint.address,
            success: true,
        });

        const balanceRequest = await tokenBlueprint.getBalance();

        console.log('new balance is ', balanceRequest.number);

        expect(toNano(balanceRequest.number)).toBeGreaterThan(toNano("4.99"));
    });

    it("should return deposit funds as no command is sent", async () => {
        const balanceRequest_old = await tokenBlueprint.getBalance();
        console.log('balance is ', balanceRequest_old.number);

        const senderWallet = await blockchain.treasury("sender");

        const depositMessageResult = await tokenBlueprint.sendNoCodeDeposit(
            senderWallet.getSender(),
            toNano("0")
        );

        expect(depositMessageResult.transactions).toHaveTransaction({
            from: senderWallet.address,
            to: tokenBlueprint.address,
            success: false,
        });

        const balanceRequest = await tokenBlueprint.getBalance();
        console.log('new balance is ', balanceRequest.number);

        expect(balanceRequest.number).toBe(balanceRequest_old.number);
    });

    it("successfully withdraws funds on behalf of owner", async () => {
        const senderWallet = await blockchain.treasury("sender");

        await tokenBlueprint.sendDeposit(senderWallet.getSender(), toNano("5"));

        const withdrawalRequestResult = await tokenBlueprint.sendWithdrawalRequest(
            deployerWallet.getSender(),
            toNano("0.05"),
            toNano("1")
        );

        expect(withdrawalRequestResult.transactions).toHaveTransaction({
            from: tokenBlueprint.address,
            to: deployerWallet.address,
            success: true,
            value: toNano(1),
        });
    });

    it("fails to withdraw funds on behalf of not-owner", async () => {
        const senderWallet = await blockchain.treasury("sender");

        await tokenBlueprint.sendDeposit(senderWallet.getSender(), toNano("5"));

        const withdrawalRequestResult = await tokenBlueprint.sendWithdrawalRequest(
            senderWallet.getSender(),
            toNano("0.5"),
            toNano("1")
        );

        expect(withdrawalRequestResult.transactions).toHaveTransaction({
            from: senderWallet.address,
            to: tokenBlueprint.address,
            success: false,
            exitCode: 103,
        });
    });

    it("fails to withdraw funds because lack of balance", async () => {
        const withdrawalRequestResult = await tokenBlueprint.sendWithdrawalRequest(
            deployerWallet.getSender(),
            toNano("0.5"),
            toNano("1")
        );

        expect(withdrawalRequestResult.transactions).toHaveTransaction({
            from: deployerWallet.address,
            to: tokenBlueprint.address,
            success: false,
            exitCode: 104,
        });
    });

});
