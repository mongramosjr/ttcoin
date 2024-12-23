import { toNano } from '@ton/core';
import { TokenBlueprint } from '../wrappers/TokenBlueprint';
import { compile, NetworkProvider } from '@ton/blueprint';

export async function run(provider: NetworkProvider) {
    const tokenBlueprint = provider.open(
        TokenBlueprint.createFromConfig(
            {
                id: Math.floor(Math.random() * 10000),
                counter: 0,
            },
            await compile('TokenBlueprint')
        )
    );

    await tokenBlueprint.sendDeploy(provider.sender(), toNano('0.05'));

    await provider.waitForDeploy(tokenBlueprint.address);

    console.log('ID', await tokenBlueprint.getID());
}
