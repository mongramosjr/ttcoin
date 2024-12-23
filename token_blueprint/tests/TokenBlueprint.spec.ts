import { Blockchain, SandboxContract, TreasuryContract } from '@ton/sandbox';
import { Cell, toNano } from '@ton/core';
import { TokenBlueprint } from '../wrappers/TokenBlueprint';
import '@ton/test-utils';
import { compile } from '@ton/blueprint';

describe('TokenBlueprint', () => {
    let code: Cell;

    beforeAll(async () => {
        code = await compile('TokenBlueprint');
    });

    let blockchain: Blockchain;
    let deployer: SandboxContract<TreasuryContract>;
    let tokenBlueprint: SandboxContract<TokenBlueprint>;

    beforeEach(async () => {
        blockchain = await Blockchain.create();

        tokenBlueprint = blockchain.openContract(
            TokenBlueprint.createFromConfig(
                {
                    id: 0,
                    counter: 0,
                },
                code
            )
        );

        deployer = await blockchain.treasury('deployer');

        const deployResult = await tokenBlueprint.sendDeploy(deployer.getSender(), toNano('0.05'));

        expect(deployResult.transactions).toHaveTransaction({
            from: deployer.address,
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
});
