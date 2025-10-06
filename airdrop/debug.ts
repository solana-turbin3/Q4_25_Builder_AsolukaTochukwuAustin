import {
  address,
  createSolanaRpc,
  devnet,
  getProgramDerivedAddress,
  getAddressEncoder,
  createKeyPairSignerFromBytes
} from "@solana/kit";

import wallet from "./turbine-3-wallet.json";

const keypair = await createKeyPairSignerFromBytes(new Uint8Array(wallet));
const rpc = createSolanaRpc(devnet("https://api.devnet.solana.com"));
const PROGRAM_ADDRESS = address("TRBZyQHB3m68FGeVsqTK39Wm4xejadjVhP5MAZaKWDM");

const addressEncoder = getAddressEncoder();
const accountSeeds = [Buffer.from("prereqs"), addressEncoder.encode(keypair.address)];
const [account, bump] = await getProgramDerivedAddress({
  programAddress: PROGRAM_ADDRESS,
  seeds: accountSeeds
});

console.log("Wallet address:", keypair.address);
console.log("PDA address:", account);
console.log("PDA bump:", bump);

try {
  const accountInfo = await rpc.getAccountInfo(account).send();
  if (accountInfo.value) {
    console.log("Account exists!");
    console.log("Account data length:", accountInfo.value.data.length);
    console.log("Account owner:", accountInfo.value.owner);
    console.log("Account lamports:", accountInfo.value.lamports);
  } else {
    console.log("Account does not exist - this is good for initialization");
  }
} catch (e) {
  console.error("Error checking account:", e);
}