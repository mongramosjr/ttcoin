import { hex } from "../build/test_token.compiled.json";
import {
    beginCell,
    Cell,
    contractAddress,
    StateInit,
    storeStateInit,
    toNano,
} from "@ton/core";
import qs from "qs";
import qrcode from "qrcode-terminal";
import { config } from 'dotenv';
config();

const isTestnet = process.env.TESTNET === 'true';


async function deployScript() {
    console.log(
        "================================================================="
    );
    console.log("Deploy script is running, let's deploy our test_token.fc contract...");

    const codeCell = Cell.fromBoc(Buffer.from(hex, "hex"))[0];
    const dataCell = new Cell();

    const stateInit: StateInit = {
        code: codeCell,
        data: dataCell,
    };

    const stateInitBuilder = beginCell();
    storeStateInit(stateInit)(stateInitBuilder);
    const stateInitCell = stateInitBuilder.endCell();

    const address = contractAddress(0, {
        code: codeCell,
        data: dataCell,
    });

    console.log(
        `The address of the contract is following: ${address.toString()}`
    );

    console.log(`Please scan the QR code below to deploy the contract to ` +
        `${isTestnet ? "testnet" : "mainnet"}:`);

    let link =
        `https://tonhub.com/transfer/` +
        address.toString({
            testOnly: isTestnet,
        }) +
        "?" +
        qs.stringify({
            text: "Deploy contract",
            amount: toNano(1).toString(10),
            init: stateInitCell.toBoc({ idx: false }).toString("base64"),
        });

    qrcode.generate(link, { small: true }, (code) => {
        console.log(code);
    });
}


deployScript();