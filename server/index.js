const express = require("express");
const app = express();
const cors = require("cors");
const port = 3042;
const { utf8ToBytes, toHex } = require('ethereum-cryptography/utils');
const { keccak256 } = require('ethereum-cryptography/keccak');
const { secp256k1 } = require("ethereum-cryptography/secp256k1");

app.use(cors());
app.use(express.json());

const balances = {
  "02acaa1f10915549842ce92ac8b4cbe62693e1067fec2533434c137ca314ce425d": 100, //private: e20f21a7a0370eafdbe98eabc1ac3caf5f17e6141ab52830d8d6db74affafd7a
  "03c603289d6ac48a39c60ebc37aa77417cd3648dbf017699bad87ccdd761d442a9": 50, //private: b94cae5958028d11d49b60b1d175846fd68c68a7d0b0a44ae8086b3d5a3adf61
  "035a416aec9d7fe9dbc44a761eeebe6747a026eeae94f79793618115181d331900": 75, //private: e2ce83b1e091a950d2fe3f9ddeaef8fc0a1a6392add5d358dac9321cc30f580b
};

app.get("/balance/:address", (req, res) => {
  const { address } = req.params;
  const balance = balances[address] || 0;
  res.send({ balance });
});

app.post("/send", async (req, res) => {

  const { sender, recipient, amount, signature, recovery } = req.body;

  if(!signature) res.status(400).send('No signature is provided');
  if(!recovery) res.status(400).send('No recovery bit was provided');

  try{

    const bytes = utf8ToBytes(JSON.stringify({sender, recipient, amount}));
    const hash = keccak256(bytes);

    const signed = new Uint8Array(signature);
    const publicKey = await secp256k1.recoverPublicKey(hash, signed, recovery);

    if(toHex(publicKey) !== sender)
    {
      res.status(400).send('Invalid signature')
    }

  }
  catch(err){
    res.send(err);
  }

  setInitialBalance(sender);
  setInitialBalance(recipient);

  if (balances[sender] < amount) {
    res.status(400).send({ message: "Not enough funds!" });
  } else {
    balances[sender] -= amount;
    balances[recipient] += amount;
    res.send({ balance: balances[sender] });
  }
});

app.listen(port, () => {
  console.log(`Listening on port ${port}!`);
});

function setInitialBalance(address) {
  if (!balances[address]) {
    balances[address] = 0;
  }
}
