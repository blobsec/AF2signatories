// SPDX-License-Identifier: GPL-3.0

pragma solidity >=0.8.0 <0.9.3;
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";

contract af2signatories{
	   
    address ownerSC;
    address addrSC;

    enum State { undefined, signed, canceled }

    struct dataAFC{
        bytes signA;
        bytes signB;
        State status;
    }
   
    mapping(bytes32 => dataAFC) afContracts;
   
    constructor() {
        ownerSC = msg.sender;
        addrSC = address(this);
    }


    function getOwnerSC() view public returns (address){
        return ownerSC;
    }

    function getAddrSC() view public returns (address){
        return addrSC;
    }

    function toEthSignedMessageHash(bytes32 hash) private pure returns (bytes32) {
        return keccak256(abi.encodePacked("\x19Ethereum Signed Message:\n32", hash));
    }

    function validID(bytes32 _idAB, address _addrA, address _addrB, address _addrSC, bytes32 _hashM) private pure returns(bool){
        return (_idAB == keccak256(abi.encodePacked(_addrA, _addrB, _addrSC, _hashM)));
    }

    function validSign(bytes32 _hash, bytes memory _sign, address signer) private pure returns(bool){
        return (ECDSA.recover(toEthSignedMessageHash(_hash), _sign) == signer);
    }

    modifier validStatus(bytes32 _idAB)  {
        require(afContracts[_idAB].status != State.signed, "Already signed");
        require(afContracts[_idAB].status != State.canceled, "Already canceled");
      _;
    }

    function query(bytes32 _idAB) view public returns (State, bytes memory){
        State status = afContracts[_idAB].status;
        if(status == State.signed){return (status, afContracts[_idAB].signB);}
        else if(status == State.canceled){return (status, afContracts[_idAB].signA);}
        else{return (status, bytes(""));}  
    }

    event Result(address indexed account, bytes32 identifier, string info);

    function sign(bytes32 _idAB, address _addrA, bytes32 _hashC, bytes memory _signA, bytes memory _signB) public validStatus(_idAB){
        address signer = msg.sender;
        bytes32 hashData = keccak256(abi.encodePacked(_idAB, _hashC));

        require(validID(_idAB, _addrA, signer, addrSC, _hashC), "Invalid identifier");
        require(validSign(hashData,_signB,signer), "B Invalid evidence");
        require(validSign(hashData,_signA,_addrA), "A Invalid evidence");
        
        
        afContracts[_idAB].status = State.signed; 
        afContracts[_idAB].signA = _signA; 
        afContracts[_idAB].signB = _signB; 
        
        emit Result(msg.sender, _idAB, "Signed");
    }

    function cancel(bytes32 _idAB,  address _addrB, bytes32 _hashC, bytes memory _signA) public validStatus(_idAB){
        address signer = msg.sender;
        bytes32 hashData = keccak256(abi.encodePacked(_idAB, _hashC));

        require(validID(_idAB, signer, _addrB, addrSC, _hashC), "Invalid identifier");
        require(validSign(hashData,_signA,signer), "A Invalid evidence");
                
        afContracts[_idAB].status = State.canceled; 
        afContracts[_idAB].signA = _signA; 

        emit Result(msg.sender, _idAB, "Canceled");
    }

}