// SPDX-License-Identifier: SEE LICENSE IN LICENSE
pragma solidity ^0.8.0;

contract Whitelist {
    address public owner = msg.sender;
    mapping(address => bool) public whitelist;

    constructor() {
        whitelist[owner] = true;
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "Caller must be owner");
        _;
    }

    function addUser(address _addr) public onlyOwner {
        whitelist[_addr] = true;
    }

    function removeUser(address _addr) public onlyOwner {
        delete whitelist[_addr];
    }
}
