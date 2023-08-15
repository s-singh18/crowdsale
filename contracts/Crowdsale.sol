// SPDX-License-Identifier: SEE LICENSE IN LICENSE
pragma solidity ^0.8.0;

import "./Token.sol";
import "./Whitelist.sol";

contract Crowdsale {
    address public owner;
    Token public token;
    Whitelist public whitelist;
    uint256 public price;
    uint256 public maxTokens;
    uint256 public tokensSold;
    uint256 public closingTime;
    uint256 public minAmount;
    uint256 public maxAmount;

    event Buy(uint256 amount, address buyer);
    event Finalize(uint256 tokensSold, uint256 ethRaised);

    constructor(
        Token _token,
        Whitelist _whitelist,
        uint256 _price,
        uint256 _maxTokens,
        uint256 _minAmount,
        uint256 _maxAmount,
        uint256 _duration
    ) {
        owner = msg.sender;
        token = _token;
        whitelist = _whitelist;
        price = _price;
        maxTokens = _maxTokens;
        minAmount = _minAmount;
        maxAmount = _maxAmount;
        closingTime = block.timestamp + _duration;
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "Caller must be owner");
        _;
    }

    modifier notClosed() {
        require(block.timestamp < closingTime, "Contract is closed");
        _;
    }

    receive() external payable {
        uint256 amount = msg.value / price;
        buyTokens(amount * 1e18);
    }

    function buyTokens(uint256 _amount) public payable notClosed {
        require(msg.value == (_amount / 1e18) * price);
        require(token.balanceOf(address(this)) >= _amount);
        require(token.transfer(msg.sender, _amount));
        require(whitelist.whitelist(msg.sender) == true);
        require(
            (_amount / 1e18) >= minAmount,
            "Should be greater than or equal to minAmount"
        );
        require(
            (_amount / 1e18) <= maxAmount,
            "Should be less than or equal to maxAmount"
        );

        tokensSold += _amount;
        emit Buy(_amount, msg.sender);
    }

    function setPrice(uint256 _price) public onlyOwner {
        price = _price;
    }

    function finalize() public onlyOwner {
        require(token.transfer(owner, token.balanceOf(address(this))));
        uint256 value = address(this).balance;
        (bool sent, ) = owner.call{value: value}("");
        require(sent);
        emit Finalize(tokensSold, value);
    }
}
