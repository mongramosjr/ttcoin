import { Cell, toNano } from "@ton/core";
import { hex } from "../build/test_token.compiled.json";
import { Blockchain } from "@ton/sandbox";
import { TokenContract } from "../wrappers/TokenContract";
import "@ton/test-utils";

describe("test_token.fc contract tests", () => {
    it("should successfully increase counter in contract and get the proper most recent sender address", async () => {
        const blockchain = await Blockchain.create();
        const codeCell = Cell.fromBoc(Buffer.from(hex, "hex"))[0];

        const initAddress = await blockchain.treasury("initAddress");

        const myContract = blockchain.openContract(
            TokenContract.createFromConfig(
                {
                    number: 0,
                    address: initAddress.address,
                },
                codeCell
            )
        );

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
});