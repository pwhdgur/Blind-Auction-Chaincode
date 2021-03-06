'use strict';

const fs = require('fs');
const path = require('path');
const { Wallets, Gateway } = require('fabric-network');

const testNetworkRoot = path.resolve(require('os').homedir(), 'go/src/github.com/pwhdgur/hyperledger/fabric-samples/test-network');

async function main() {
    const gateway = new Gateway();
    const wallet = await Wallets.newFileSystemWallet('./wallet');

    try {
        let args = process.argv.slice(2);

        const identityLabel = args[0];
        const functionName = args[1];
        
        // optional parameters
        let optional = {};
        if (args.length > 2) {
            optional = JSON.parse(args[2]);
            console.log('optional :', optional);
        }

        const orgName = identityLabel.split('@')[1];
        const orgNameWithoutDomain = orgName.split('.')[0];

        console.log('args :',args);
        console.log('identityLabel :',identityLabel);
        console.log('functionName :',functionName);
        console.log('orgName :',orgName);
        console.log('orgNameWithoutDomain :',orgNameWithoutDomain);

        let connectionProfile = JSON.parse(fs.readFileSync(
            path.join(testNetworkRoot, 
                'organizations/peerOrganizations', 
                orgName, 
                `/connection-${orgNameWithoutDomain}.json`), 'utf8')
        );

        console.log('connectionProfile :', connectionProfile);

        let connectionOptions = {
            identity: identityLabel,
            wallet: wallet,
            discovery: {enabled: true, asLocalhost: true}
        };

        console.log('connectionOptions :', connectionOptions);

        console.log('Connect to a Hyperledger Fabric gateway.');
        await gateway.connect(connectionProfile, connectionOptions);

        console.log('Use channel "mychannel".');
        const network = await gateway.getNetwork('mychannel');

        console.log('Use BlindAuction.');
        const contract = network.getContract('blind_auction');

        let chaincodeArgs = optional.args || [];

        let transientMap = optional.transient || {};
        Object.entries(transientMap).forEach(([key, value]) => {
            transientMap[key] = Buffer.from(value);
        });

        console.log('Submit ' + functionName + ' transaction.');
        const response = await contract.createTransaction(functionName).
            setTransient(transientMap).
            setEndorsingOrganizations([gateway.getIdentity().mspId]).
            submit(...chaincodeArgs);
        if (`${response}` !== '') {
            console.log(`Response from ${functionName}: ${response}`);
        }

    } catch (error) {
        console.log(`Error processing transaction. ${error}`);
        console.log(error.stack);
    } finally {
        console.log('Disconnect from the gateway.');
        gateway.disconnect();
    }
}

main();