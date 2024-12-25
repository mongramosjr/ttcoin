import { address, toNano } from '@ton/core';
import { TokenBlueprint } from '../wrappers/TokenBlueprint';
import { compile, NetworkProvider } from '@ton/blueprint';

export async function run(provider: NetworkProvider) {
    const tokenBlueprint = provider.open(
        TokenBlueprint.createFromConfig(
            {
                id: Math.floor(Math.random() * 10000),
                counter: 0,
                address: address("0QAJpP-ZAUCmV4ZIM4873mBK9Q7WFQEVwk4kNLPv6m2lxRBg"),
                owner_address: address("0QAJpP-ZAUCmV4ZIM4873mBK9Q7WFQEVwk4kNLPv6m2lxRBg"),
            },
            await compile('TokenBlueprint')
        )
    );

    await tokenBlueprint.sendDeploy(provider.sender(), toNano('0.05'));

    await provider.waitForDeploy(tokenBlueprint.address);

    console.log('ID', await tokenBlueprint.getID());
}
