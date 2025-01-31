const {
  loadFixture
} = require("@nomicfoundation/hardhat-network-helpers");
const { expect } = require("chai");

const Status = {
  undefined: 0,
  signed: 1,
  canceled: 2
}

describe("af2signatories", function () {

  // Define a fixture to reuse the same setup in every test
  async function deployContractFixture() {
    const [owner, A, B] = await ethers.getSigners();

    const Af2signatories = await ethers.getContractFactory("af2signatories");
    const af2signatories = await Af2signatories.deploy();

    const { address: addrA } = A;
    const { address: addrB } = B;

    const hashC = ethers.hashMessage("valid hashC");

    const addrSC = await af2signatories.target;

    const idAB = ethers.solidityPackedKeccak256(['address', 'address', 'address', 'bytes32'], [addrA, addrB, addrSC, hashC]);

    const { sign: signA } = await signData(idAB, hashC, A);
    const { sign: signB } = await signData(idAB, hashC, B);

    return { af2signatories, owner, addrSC, A, addrA, B, addrB, hashC, idAB, signA, signB };
  }

  async function signData(idAB, hashC, signer) {
    const hashData = ethers.solidityPackedKeccak256(["bytes32", "bytes32"], [idAB, hashC]);
    return {
      hashData,
      sign: await signer.signMessage(ethers.getBytes(hashData))
    }
  }


  describe("Deployment", function () {

    it("Should set the right owner", async function () {
      const { af2signatories, owner } = await loadFixture(deployContractFixture);
      expect(await af2signatories.getOwnerSC()).to.equal(owner.address);
    });

    it("Should set the right addrSC", async function () {
      const { af2signatories, addrSC } = await loadFixture(deployContractFixture);
      expect(await af2signatories.getAddrSC()).to.equal(addrSC);
    });

    it("Should get undefined state", async function () {
      const { af2signatories, idAB } = await loadFixture(deployContractFixture);
      expect(await af2signatories.query(idAB)).to.deep.equal([Status.undefined, "0x"]);
    });
  })

  describe("Sign", function () {

    it("Should emit an event on sign", async function () {
      const { af2signatories, addrA, B, addrB, hashC, idAB, signA, signB } = await loadFixture(deployContractFixture);

      await expect(af2signatories.connect(B).sign(idAB, addrA, hashC, signA, signB))
        .to.emit(af2signatories, "Result")
        .withArgs(addrB, idAB, "Signed");
    });

    it("Should get signed status after sign", async function () {
      const { af2signatories, addrA, B, hashC, idAB, signA, signB } = await loadFixture(deployContractFixture);

      await af2signatories.connect(B).sign(idAB, addrA, hashC, signA, signB);
      expect(await af2signatories.query(idAB)).to.deep.equal([Status.signed, signB]);
    });

    it("Shouldn't sign if already signed", async function () {
      const { af2signatories, addrA, B, hashC, idAB, signA, signB } = await loadFixture(deployContractFixture);

      await af2signatories.connect(B).sign(idAB, addrA, hashC, signA, signB);
      await expect(af2signatories.connect(B).sign(idAB, addrA, hashC, signA, signB))
        .to.be.revertedWith("Already signed");
    });

    it("Shouldn't cancel if already canceled", async function () {
      const { af2signatories, A, addrA, B, addrB, hashC, idAB, signA, signB } = await loadFixture(deployContractFixture);

      await af2signatories.connect(A).cancel(idAB, addrB, hashC, signA);
      await expect(af2signatories.connect(B).sign(idAB, addrA, hashC, signA, signB))
        .to.be.revertedWith("Already canceled");
    });

    it("Shouldn't sign provided signA is invalid", async function () {
      const { af2signatories, addrA, B, idAB, hashC, signB } = await loadFixture(deployContractFixture);

      const invalidSignA = signB;

      await expect(af2signatories.connect(B).sign(idAB, addrA, hashC, invalidSignA, signB))
        .to.be.revertedWith("A Invalid evidence");
    });

    it("Shouldn't sign by A", async function () {
      const { af2signatories, addrA, A, idAB, hashC, signA, signB } = await loadFixture(deployContractFixture);

      await expect(af2signatories.connect(A).sign(idAB, addrA, hashC, signA, signB))
        .to.be.revertedWith("Invalid identifier");
    });
  })

  describe("Cancel", function () {
    it("Should cancel", async function () {
      const { af2signatories, addrA, A, addrB, hashC, idAB, signA } = await loadFixture(deployContractFixture);

      await expect(af2signatories.connect(A).cancel(idAB, addrB, hashC, signA))
        .to.emit(af2signatories, "Result")
        .withArgs(addrA, idAB, "Canceled");
    });

    it("Should get canceled status after cancel", async function () {
      const { af2signatories, A, addrB, hashC, idAB, signA } = await loadFixture(deployContractFixture);
      await af2signatories.connect(A).cancel(idAB, addrB, hashC, signA);
      expect(await af2signatories.query(idAB)).to.deep.equal([Status.canceled, signA]);
    });

    it("Shouldn't cancel by B", async function () {
      const { af2signatories, B, addrB, hashC, idAB, signA } = await loadFixture(deployContractFixture);

      await expect(af2signatories.connect(B).cancel(idAB, addrB, hashC, signA))
        .to.be.revertedWith("Invalid identifier");
    });

    it("Shouldn't cancel with A invalid evidence", async function () {
      const { af2signatories, A, addrB, hashC, idAB } = await loadFixture(deployContractFixture);

      const invalidHashC = ethers.hashMessage("invalid hashC");
      const { sign: invalidSignA } = await signData(idAB, invalidHashC, A);

      await expect(af2signatories.connect(A).cancel(idAB, addrB, hashC, invalidSignA))
        .to.be.revertedWith("A Invalid evidence");
    });

    it("Shouldn't cancel after sign", async function () {
      const { af2signatories, A, addrA, B, addrB, hashC, idAB, signA, signB } = await loadFixture(deployContractFixture);

      await af2signatories.connect(B).sign(idAB, addrA, hashC, signA, signB);

      await expect(af2signatories.connect(A).cancel(idAB, addrB, hashC, signA))
        .to.be.revertedWith("Already signed");
    });

  })

})