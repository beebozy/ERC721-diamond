import { ethers } from "hardhat";
import fs from "fs";
import csv from "csv-parser";
import { MerkleTree } from "merkletreejs";
import keccak256 from "keccak256";

const CSV_FILE_PATH = "../contracts/addresses/addresses.csv";

const leafNodes: Buffer[] = [];

fs.createReadStream(CSV_FILE_PATH)
	.pipe(csv())
	.on("data", (row: { account: string; amount: number }) => {
		const address = row.account;  // Changed from row.address to row.account

		// Validate the Ethereum address
		if (!ethers.isAddress(address)) {
			console.error(`Invalid address detected: ${address}`);
			return;
		}

		// Check if amount is valid
		if (!row.amount) {
			console.error(`Missing amount for address: ${address}`);
			return;
		}

		// const amount = ethers.parseUnits(row.amount.toString(), 6); // Convert to Wei

		// Hashing to create a leaf node (bytes32)
		const leaf = keccak256(`${address},${row.amount}`);

		leafNodes.push(leaf);
	})
	.on("end", () => {
		if (leafNodes.length === 0) {
			console.error("No valid entries found in the CSV file.");
			return;
		}

		const merkleTree = new MerkleTree(leafNodes, keccak256, {
			sortPairs: true,
		});

		const rootHash = merkleTree.getHexRoot();
		console.log("Merkle Root:", rootHash);

		// Extracting proof for this address
		const address = "0x4AF79fFCaBb09083aF6CcC3b2C20Fe989519f6d7";
		const amount = 50; // Example amount

		// Create leaf for proof
		const leaf = keccak256(`${address},${amount}`);

		console.log("Leaf:", leaf.toString("hex"));

		const proof = merkleTree.getHexProof(leaf);
		console.log("Proof:", proof);
	});

	/*[
  0x6d02dcf5be716142f165545da29baa1e8a96192c696d0271455f4fbccde1228d,
  0x443724efd888a9e47fac469758dfce1d7c21c60acf0d77a826df1ac380d1f0d4,
  0xb764436f1c5975cc6156442bb6a3fb925223716441c23ac0e2057a306e39a343,
  0xf0af0b142f086e388118a444fb8dd7fe1629b03b7a2d883207fdd558c0054f07
] */