# Blind Auction Chaincode and Application
- Reference Material : the linux foundation lfd272

## Set Netowrk && Environment

### explain scenario
1) 채널 참가자중에 seller에게 lot & 최소 가격 정보를 제공.
2) 여러 Bidder는 최소 가격이상으로 제안해야함.
3) seller는 경매를 중지할수 있음. 

### define the chaincode functions
1) offerForSale(lotID, lotDescription, minimalBid) to create a new lot in the channel

2) placeBid(lotId, price) to place a bid for the specified lot in the private data collection accessible only by Bidder and Seller

3) closeBidding(lotID) to close bidding for a specified lot.

4) listBids(lotID)to list all the placed bids for amoment

5) listLotsForSale(),listSoldLots(), and listWithdrawnLots() to list the lots in the specific status.

### test-network 구동 for Org1, Org2 and Org3
- hyperledger fabric v2.2
  ./network.sh up createChannel -ca -s couchdb
  cd addOrg3
  ./addOrg3.sh up -ca -s couchdb
  
### CouchDB URL
- http://localhost:5984/_utils 확인 가능
- COUCHDB_USER=admin
- COUCHDB_PASSWORD=adminpw

### Terminal 1 Environment variables for Org1MS 
- export PATH=${PWD}/../bin:$PATH
- export FABRIC_CFG_PATH=$PWD/../config/
- cd $HOME/go/src/github.com/pwhdgur/hyperledger/fabric-samples/test-network
- export CORE_PEER_TLS_ENABLED=true
- export CORE_PEER_LOCALMSPID="Org1MSP"
- export CORE_PEER_TLS_ROOTCERT_FILE=${PWD}/organizations/peerOrganizations/org1.example.com/peers/peer0.org1.example.com/tls/ca.crt
- export CORE_PEER_MSPCONFIGPATH=${PWD}/organizations/peerOrganizations/org1.example.com/users/Admin@org1.example.com/msp
- export CORE_PEER_ADDRESS=localhost:7051

### Deploy the BlindAuction chaincode for Org1, Org2
- cd $HOME/go/src/github.com/pwhdgur/hyperledger/fabric-samples/test-network

- Do not forget to specify the configuration file for private data collections
- network.sh : Org1, Org2

- ./network.sh deployCC -ccn blind_auction -ccv 1.0 -ccp ~/go/src/github.com/pwhdgur/hyperledger/fabric-samples/lfd272/chaincodes/Lab14/blind_auction -ccl javascript -cccg ~/go/src/github.com/pwhdgur/hyperledger/fabric-samples/lfd272/chaincodes/Lab14/blind_auction/collections_config.json -ccep "OR('Org1MSP.member','Org2MSP.member','Org3MSP.member')"

### Define all necessary environment variables for Org3MSP
- export PATH=${PWD}/../bin:$PATH
- export FABRIC_CFG_PATH=$PWD/../config/
- export CORE_PEER_TLS_ENABLED=true
- export CORE_PEER_LOCALMSPID="Org3MSP"
- export CORE_PEER_TLS_ROOTCERT_FILE=${PWD}/organizations/peerOrganizations/org3.example.com/peers/peer0.org3.example.com/tls/ca.crt
- export CORE_PEER_MSPCONFIGPATH=${PWD}/organizations/peerOrganizations/org3.example.com/users/Admin@org3.example.com/msp
- export CORE_PEER_ADDRESS=localhost:11051

### Manually Deploy the BlindAuction chaincode for Org3
- should install, commit Org3 manually

#### Package the BlindAuction chaincode on peer0.org3 (Skip optional, deployCC 단계에서 진행되었음)
- Skip : deployCC 단계에서 진행되었음)

#### Install the BlindAuction chaincode on peer0.org3
- peer lifecycle chaincode install blind_auction.tar.gz

#### Approve a chaincode definition on behalf of Org3
- export PACKAGE_ID=blind_auction_1.0:82222cbbe6811d65c4ca974af43a2e2d2587884ab1e5a11edb7e1437a47d0204

- peer lifecycle chaincode approveformyorg -o localhost:7050 --ordererTLSHostnameOverride orderer.example.com --channelID mychannel --name blind_auction --version 1.0 --package-id $PACKAGE_ID --sequence 1 --tls --cafile ${PWD}/organizations/ordererOrganizations/example.com/orderers/orderer.example.com/msp/tlscacerts/tlsca.example.com-cert.pem --collections-config ../lfd272/chaincodes/Lab14/blind_auction/collections_config.json --signature-policy "OR('Org1MSP.member','Org2MSP.member','Org3MSP.member')"

#### checkcommitreadiness on behalf of Org3
- Skip

#### commit for Org3
- Skip

#### querycommitted for Org3
- peer lifecycle chaincode querycommitted --channelID mychannel --name blind_auction --cafile ${PWD}/organizations/ordererOrganizations/example.com/orderers/orderer.example.com/msp/tlscacerts/tlsca.example.com-cert.pem


## Application Part

### Install the application
- cd ~/blind_auction_app
- rm -Rf node_modules
- rm -Rf wallet
- npm install

### Run addToWallet.js
- node addToWallet.js

#### step-by-step : the auction workflow
1) Create a lot on behalf of Admin@org1.example.com
- node submitTransaction.js 'Admin@org1.example.com' offerForSale '{"args":["lot1", "pen", "10"]}'

2) Place bids(입찰) on behalf of Admin@org2.example.com and Admin@org3.example.com
- node submitTransaction.js 'Admin@org2.example.com' placeBid '{"args":["lot1"], "transient":{"price":"12"}}'
- node submitTransaction.js 'Admin@org3.example.com' placeBid '{"args":["lot1"], "transient":{"price":"14"}}'

2-1) Check the bids on behalf of Admin@org1.example.com
- node submitTransaction.js 'Admin@org1.example.com' listBids '{"args":["lot1"]}'
- Response from listBids : [{"bidder":"Org2MSP","id":"lot1","price":12},{"bidder":"Org3MSP","id":"lot1","price":14}]

3) Close bidding for the lot
- node submitTransaction.js 'Admin@org1.example.com' closeBidding '{"args":["lot1"]}'

3-1) The lot should be sold to Org3, the highest bidder
- node submitTransaction.js 'Admin@org1.example.com' listSoldLots
- Response from listSoldLots : [{"buyer":"Org3MSP","description":"pen","hammerPrice":14,"id":"lot1","minimalBid":10,"seller":"Org1MSP","status":2}]

## Docker Log (Optional)
- docker logs dev-peer0.org1.example.com-reports_1.0-??????????????? -f

## Clear Up
- ./network.sh down

