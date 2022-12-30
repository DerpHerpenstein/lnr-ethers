# lnr-ethers
This package simplifies interacting with the Linagee Name Register contract, wrapper and resolver

```
const provider = new ethers.providers.Web3Provider(window.ethereum);
await provider.send("eth_requestAccounts", []);
const signer = provider.getSigner();
let lnr = new LNR(ethers, signer);

```

# lnr.resolveName
Looks up the address of name.  If the name does not have a primary configured null is returned

```
lnr.resolveName("herpenstein.og");
//  0x00F6426fD5215B0c9A2BFC66D49fA5909FaB7701
```

# lnr.lookupAddress
Performs a reverse lookup of the address in LNR using the primary mapping in the resolver contract. If the address does not have a primary configured null is returned
```
await test.lookupAddress("0x00F6426fD5215B0c9A2BFC66D49fA5909FaB7701");
//  herpenstein.og
```
