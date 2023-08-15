import { useEffect, useState } from "react";
import { Container, Row, Col } from "react-bootstrap";
import { ethers } from "ethers";
import { format } from "date-fns";

import Navigation from "./Navigation";
import Info from "./Info";
import Progress from "./Progress";
import Loading from "./Loading";
import Buy from "./Buy";
import Whitelist from "./Whitelist";

import TOKEN_ABI from "../abis/Token.json";
import WHITELIST_ABI from "../abis/Whitelist.json";
import CROWDSALE_ABI from "../abis/Crowdsale.json";

import config from "../config.json";

function App() {
  const [provider, setProvider] = useState(null);
  const [crowdsale, setCrowdsale] = useState(null);

  const [account, setAccount] = useState(null);
  const [accountBalance, setAccountBalance] = useState(0);

  const [price, setPrice] = useState(0);
  const [maxTokens, setMaxTokens] = useState(0);
  const [tokensSold, setTokensSold] = useState(0);

  const [isLoading, setIsLoading] = useState(true);

  const [whitelist, setWhitelist] = useState(null);
  const [currentTimestamp, setCurrentTimestamp] = useState(null);
  const [closingTimestamp, setClosingTimestamp] = useState(null);

  const timestampToDateTime = (blockTimestamp) => {
    return new Date(blockTimestamp * 1000).toLocaleString();
  };

  const ICOStatus = ({ endTime }) => {
    const currentTime = Math.floor(Date.now() / 1000);
    if (currentTime > closingTimestamp) {
      return <p className="text-center">Sale closed</p>;
    } else {
      return (
        <p className="text-center">
          <strong>Closing time: </strong>
          {timestampToDateTime(closingTimestamp)}
        </p>
      );
    }
  };

  const loadBlockchainData = async () => {
    // Initiate provider
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    const signer = provider.getSigner();
    setProvider(provider);

    // Initiate contracts
    const token = new ethers.Contract(
      config[31337].token.address,
      TOKEN_ABI,
      provider
    );
    setWhitelist(
      new ethers.Contract(
        config[31337].whitelist.address,
        WHITELIST_ABI,
        signer
      )
    );
    const crowdsale = new ethers.Contract(
      config[31337].crowdsale.address,
      CROWDSALE_ABI,
      provider
    );

    setCrowdsale(crowdsale);
    let accounts = await window.ethereum.request({
      method: "eth_requestAccounts",
      params: [],
    });

    const account = ethers.utils.getAddress(accounts[0]).toLowerCase();
    setAccount(account);

    const accountBalance = ethers.utils.formatUnits(
      await token.balanceOf(account),
      18
    );
    setAccountBalance(accountBalance);

    const price = ethers.utils.formatUnits(await crowdsale.price(), 18);
    setPrice(price);
    const maxTokens = ethers.utils.formatUnits(await crowdsale.maxTokens(), 18);
    setMaxTokens(maxTokens);
    const tokensSold = ethers.utils.formatUnits(
      await crowdsale.tokensSold(),
      18
    );
    setTokensSold(tokensSold);
    const blockNumber = await provider.getBlockNumber();
    setCurrentTimestamp(Math.floor(Date.now() / 1000));
    setClosingTimestamp(await crowdsale.closingTime());

    setIsLoading(false);
  };

  useEffect(() => {
    if (isLoading) {
      loadBlockchainData();
    }
  }, [isLoading]);

  window.ethereum.on(
    "accountsChanged",
    () => {
      if (isLoading) {
        loadBlockchainData();
      }
    },
    [isLoading]
  );

  return (
    <Container>
      <Navigation />
      <h1 className="my-4 text-center">Introducing DApp Token!</h1>
      {isLoading ? (
        <Loading />
      ) : (
        <>
          <p className="text-center">
            <strong>Current Price: </strong>
            {price} ETH
          </p>
          <Buy
            provider={provider}
            price={price}
            crowdsale={crowdsale}
            setIsLoading={setIsLoading}
          />
          <Progress maxTokens={maxTokens} tokensSold={tokensSold} />
        </>
      )}
      <Row>
        <ICOStatus endTime={closingTimestamp} />
      </Row>
      {account && <Info account={account} accountBalance={accountBalance} />}

      {account === config[31337].owner.address ? (
        <Whitelist provider={provider} whitelist={whitelist} />
      ) : (
        <p />
      )}
    </Container>
  );
}

export default App;
