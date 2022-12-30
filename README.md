# lnr-ethers
This package simplifies interacting with the Linagee Name Register contract, wrapper and resolver.

To generate the library, run "npx webpack"

# lnr-ethers - Getting Started
After you generated the library, add it to your ethers project with a script tag after you import ethers.js

```
<script src="https://cdn.ethers.io/lib/ethers-5.2.umd.min.js" type="application/javascript"></script>
<script src="path-to-file/lnr-ethers-0.1.0.js" type="application/javascript"></script>
```

Setup your ethers environment, and call the LNR constructor and pass it your ethers instance and your signer

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
