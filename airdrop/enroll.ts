import {
address,
appendTransactionMessageInstructions,
assertIsTransactionWithinSizeLimit,
createKeyPairSignerFromBytes,
createSolanaRpc,
createSolanaRpcSubscriptions,
createTransactionMessage,
devnet,
getSignatureFromTransaction,
pipe,
sendAndConfirmTransactionFactory,
setTransactionMessageFeePayerSigner,
setTransactionMessageLifetimeUsingBlockhash,
signTransactionMessageWithSigners,
addSignersToTransactionMessage,
getProgramDerivedAddress,
generateKeyPairSigner,
getAddressEncoder,
getBytesEncoder
} from "@solana/kit";
const MPL_CORE_PROGRAM = address("CoREENxT6tW1HoK8ypY1SxRMZTcVPm7R94rH4PZNhX7d");
const PROGRAM_ADDRESS = address("TRBZyQHB3m68FGeVsqTK39Wm4xejadjVhP5MAZaKWDM");
const SYSTEM_PROGRAM = address("11111111111111111111111111111111");
import { getInitializeInstruction, getSubmitTsInstruction } from "./clients/js/src/generated/index";

import wallet from "./turbine-3-wallet.json";

const keypair = await createKeyPairSignerFromBytes(new Uint8Array(wallet));

const rpc = createSolanaRpc(devnet("https://api.devnet.solana.com"));
const rpcSubscriptions = createSolanaRpcSubscriptions(devnet('ws://api.devnet.solana.com'));

const addressEncoder = getAddressEncoder();
// Create the PDA for enrollment account
const accountSeeds = [Buffer.from("prereqs"), addressEncoder.encode(keypair.address)];
const [account, _bump] = await getProgramDerivedAddress({
  programAddress: PROGRAM_ADDRESS,
  seeds: accountSeeds
});

const COLLECTION = address("5ebsp5RChCGK7ssRZMVMufgVZhd2kFbNaotcZ5UvytN2");
const [authorityPDA] = await getProgramDerivedAddress({
  programAddress: PROGRAM_ADDRESS,
  seeds: [
    getBytesEncoder().encode(new Uint8Array([99, 111, 108, 108, 101, 99, 116, 105, 111, 110])), // "collection"
    getAddressEncoder().encode(COLLECTION)
  ]
});

// Generate mint keypair for the NFT
const mintKeyPair = await generateKeyPairSigner();

// Execute the initialize transaction
const initializeIx = getInitializeInstruction({
  github: "asoluka",
  user: keypair,
  account,
  systemProgram: SYSTEM_PROGRAM
});

// Fetch latest blockhash
const { value: latestBlockhash } = await rpc.getLatestBlockhash().send();
const sendAndConfirmTransaction = sendAndConfirmTransactionFactory({ rpc, rpcSubscriptions });
// const transactionMessageInit = pipe(createTransactionMessage({ version: 0 }), tx => setTransactionMessageFeePayerSigner(keypair, tx), tx => setTransactionMessageLifetimeUsingBlockhash(latestBlockhash, tx), tx => appendTransactionMessageInstructions([initializeIx], tx));
// const signedTxInit = await signTransactionMessageWithSigners(transactionMessageInit);
// assertIsTransactionWithinSizeLimit(signedTxInit);

// try {
//   const result = await sendAndConfirmTransaction(signedTxInit, { commitment: 'confirmed', skipPreflight: false });
//   console.log(result);
//   const signatureInit = getSignatureFromTransaction(signedTxInit);
//   console.log(`Success! Check out your TX here: https://explorer.solana.com/tx/${signatureInit}?cluster=devnet`);
// } catch (e) {
//   console.error(`Oops, something went wrong: ${e}`);
//   console.log(e)
// }

// Execute the submitTs transaction
const submitIx = getSubmitTsInstruction({
  user: keypair,
  account,
  mint: mintKeyPair,
  collection: COLLECTION,
  authority: authorityPDA,
  mplCoreProgram: MPL_CORE_PROGRAM,
  systemProgram: SYSTEM_PROGRAM
});
const transactionMessageSubmit = pipe( createTransactionMessage({ version: 0 }),
  tx => setTransactionMessageFeePayerSigner(keypair, tx),
  tx => setTransactionMessageLifetimeUsingBlockhash(latestBlockhash, tx),
  tx => appendTransactionMessageInstructions([submitIx], tx),
  tx => addSignersToTransactionMessage([mintKeyPair], tx) // Add mint as additional signer after appending instructions
);
const signedTxSubmit = await signTransactionMessageWithSigners(transactionMessageSubmit);
assertIsTransactionWithinSizeLimit(signedTxSubmit);
try {
  await sendAndConfirmTransaction(signedTxSubmit, { commitment: 'confirmed', skipPreflight: false });
  const signatureSubmit = getSignatureFromTransaction(signedTxSubmit);

  console.log(`Success! Check out your TX here: https://explorer.solana.com/tx/${signatureSubmit}?cluster=devnet`);
} catch (e) {
  console.error(`Oops, something went wrong: ${e}`);
  console.log(e)
}