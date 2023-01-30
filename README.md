# lnr-ethers
<p align="center">
  <img src="https://github.com/Linagee-Name-Registrar/Brand-Kit/blob/main/icon/svg/lnr_icon_box.svg" alt="LNR Logo" width=33% height=33%>
</p>
This package simplifies interacting with the Linagee Name Registrar contract, wrapper and resolver.

To generate the library, run "npx webpack"

## Getting Started
### Note: for domains to be used with the resolver, they must first be unwrapped
After you've generated the library, add it to your ethers project with a script tag after you import ethers.js

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



# Resolver Contract
## lnr.resolveName - [Resolver Contract]
Looks up the address of name.  If the name does not have a primary configured, returns null

```
lnr.resolveName("herpenstein.og");
//  0x00F6426fD5215B0c9A2BFC66D49fA5909FaB7701
```

## lnr.lookupAddress - [Resolver Contract]
Performs a reverse lookup of the address using the primary mapping in the resolver contract. If the address does not have a primary configured, returns null
```
await lnr.lookupAddress("0x00F6426fD5215B0c9A2BFC66D49fA5909FaB7701");
//  herpenstein.og
```

## lnr.setPrimary - [Resolver Contract]
Callable by the owner or controller, this function configures a primary address so that lnr.lookupAddress resolves to the name specified and lnr.resolveName resolves to the owners address (Note: domain must be unwrapped)
```
await lnr.setPrimary("herpenstein.og");
```

## lnr.unsetPrimary - [Resolver Contract]
Removes the primary address from the user that calls the function
```
await lnr.unsetPrimary();
```

## lnr.setController - [Resolver Contract]
Callable by the domain owner, this function delegates a controller address that will be able to use this domain as its primary. (Note: domain must be unwrapped)
```
await lnr.setController("0x00F6426fD5215B0c9A2BFC66D49fA5909FaB7701");
```

## lnr.unsetController - [Resolver Contract]
Callable by the domain owner, this function removes the specified controller from the specified domain
```
await lnr.unsetController("herpenstein.og", "0x00F6426fD5215B0c9A2BFC66D49fA5909FaB7701");
```

## lnr.verifyIsNameOwner - [Resolver Contract]
Checks to see if the address specified is the owner or a controller of the domain
```
await lnr.verifyIsNameOwner("herpenstein.og", "0x00F6426fD5215B0c9A2BFC66D49fA5909FaB7701");
```



# Wrapper Contract
## Note: There are 4 steps to wrapping a domain
1. Create the wrapper with: lnr.createWrapper(domainName)
2. Ensure the users address is returned by: lnr.waitForWrap(domainName)
3. Transfer the unwrapped domain with: lnr.transfer(domainName, lnr.wrapperAddress)
4. Wrap the domain and get the ERC721 with: lnr.wrap(domainName)


## lnr.createWrapper - [Wrapper Contract]
Creates a wrapper for the specified domain
```
await lnr.createWrapper("herpenstein.og");
```

## lnr.waitForWrap - [Wrapper Contract]
Returns the user who wants to wrap the specified domain.  Returns null if no wrapper was created (NOTE: Do not transfer domain if waitForWrap returns null!!!)
```
await lnr.waitForWrap("herpenstein.og");
```

## lnr.wrap - [Wrapper Contract]
Called after the wrapper has beed created, checked and the domain has been transfered.  This function will issue the user a wrapped ERC721 of their domain
```
await lnr.wrap("herpenstein.og");
```

## lnr.safeTransferFrom - [Wrapper Contract]
Transfers a wrapped domain
```
await lnr.safeTransferFrom(fromAddress, toAddress, "herpenstein.og");
```



# Original Linagee Contract
## lnr.owner - [Linagee Contract]
Returns [ownerAddress, wrappedStatus] of a specified domain
```
await lnr.owner("herpenstein.og");
//  ["0x00F6426fD5215B0c9A2BFC66D49fA5909FaB7701", "unwrapped"]
```

## lnr.reserve - [Linagee Contract]
Reserves a new domain
```
await lnr.reserve("herpenstein.og");
```

## lnr.transfer- [Linagee Contract]
Transfers an unwrapped domain to the specified address
```
await lnr.reserve("0x00F6426fD5215B0c9A2BFC66D49fA5909FaB7701", "herpenstein.og");
```
