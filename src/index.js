import {ens_normalize} from '@adraffy/ens-normalize';
import resolverAbi from '../abi/lnrResolverAbi.json';
import wrapperAbi from '../abi/wrapperAbi.json';
import linageeAbi from '../abi/linageeAbi.json';


/**
 * A class to interact with the Linagee Name Registrar ecosystem
 */
class LNR {

  static get RESOLVER_ADDRESS() {
    return "0x6023E55814DC00F094386d4eb7e17Ce49ab1A190";
  }

  static get WRAPPER_ADDRESS() {
    return "0x2Cc8342d7c8BFf5A213eb2cdE39DE9a59b3461A7";
  }

  static get LINAGEE_ADDRESS() {
    return "0x5564886ca2C518d1964E5FCea4f423b41Db9F561";
  }

  /**
   * Creates a new instance of the LNR class
   *
   *  TODO - Idea - remove _ethers and _signer parameters and replace with _provider?
   *
   * @param {ethers} _ethers An instance of ethers
   * @param _signer An instance of ethers Signer
   */
  constructor(_ethers, _signer) {
    this.ethers = _ethers;
    this.signer = _signer;
    this.resolverAbi = resolverAbi;
    this.wrapperAbi = wrapperAbi;
    this.linageeAbi = linageeAbi;
    this.resolverContract = new this.ethers.Contract(LNR.RESOLVER_ADDRESS, this.resolverAbi, this.signer);
    this.wrapperContract = new this.ethers.Contract(LNR.WRAPPER_ADDRESS, this.wrapperAbi, this.signer);
    this.linageeContract = new this.ethers.Contract(LNR.LINAGEE_ADDRESS, this.linageeAbi, this.signer);
  }


  //--------------------------- HELPERS ---------------------------

  /**
   * Converts a bytes32 value to a string
   *
   * @param {string} _hex A hexadecimal string representation of a bytes32 value
   * @returns {string} The string representation of the bytes32 value
   */
  bytes32ToString(_hex) {
    return this.ethers.utils.toUtf8String(this.ethers.utils.arrayify(_hex).filter(n => n != 0));
  }


  /**
   * Converts a string to a bytes32 value
   *
   * @param {string} _string The string to convert
   * @returns {string} The bytes32 value
   */
  stringToBytes32(_string) {
    let result = this.ethers.utils.hexlify(this.ethers.utils.toUtf8Bytes(_string));
    while (result.length < 66) {
      result += '0';
    }
    if (result.length !== 66) {
      throw new Error("invalid web3 implicit bytes32");
    }
    return result;
  }

  /**
   * Converts a domain (Ex:test.og) into a bytes32 value (0x..)
   *
   * @param _name The domain string
   * @returns The bytes32 value
   */
  domainToBytes32(_name) {
    let checkIsValid = this.isValidDomain(_name);
    if (checkIsValid[0] == false) {
      throw checkIsValid[1];
    } else {
      let normalized = checkIsValid[1];
      let nameOnly = normalized.slice(0, -3);
      return this.stringToBytes32(nameOnly);
    }
  }

  /**
   * Converts a bytes32 to a domain
   *
   * @param _name Bytes32
   * @returns {string} Domain
   */
  bytes32ToDomain(_name) {
        return this.bytes32ToString(_name) + ".og";
      }

  /**
   * Uses adraffy/ens-normalize to normalize a string
   *
   * @param _name The domain to normalize
   * @returns {string} The normalized domain
   */
  normalize(_name) {
        return ens_normalize(_name);
      }

  /**
   * Takes a domain, normalizes it, checks that it is not a subdomain, is an og
   * domain, and isnt too long
   *
   * @param _name The domain to check
   * @returns an array with the first element being a boolean indicating if the domain is valid,
   * and the second element being the normalized domain
   */
  isValidDomain(_name) {
        const byteSize = function(str){return (new Blob([str]).size)};
        if(!_name || _name.length == 0)
          return [false, "Empty string passed"];
        let normalized = this.normalize(_name);
        if((normalized.split(".").length - 1) > 1){
          return [false, 'Subdomains not supported at this time'];
        }
        else if(!normalized.endsWith(".og")){
          return [false,'Domain does not end in .og'];
        }
        else if(byteSize(normalized) > 35){
          return [false, 'Domain too long'];
        }
        else{
          return [true, normalized];
        }
      }


  //--------------------------- RESOLVER ---------------------------

  /**
   * Verifies that a domain is owned or controlled by a given address
   *
   * @param _name The domain to check
   * @param _address The address to check
   * @returns {boolean} True if the domain is owned by the address, false otherwise
   */
  async verifyIsNameOwner(_name, _address) {
        const that = this;
        const nameBytes = this.domainToBytes32(_name);
        return this.resolverContract.verifyIsNameOwner(nameBytes, _address).then(function(result){
          return result;
        });
      }

  /**
   * Resolves the primary address of the domain, if there is no primary, returns null
   *
   * @param _name The domain to check
   * @returns
   */
  async resolveName(_name) {
        let checkIsValid = this.isValidDomain(_name);
        if(checkIsValid[0] == false){
          throw checkIsValid[1];
        }
        else{
          let normalized = checkIsValid[1];
          const that = this;
          return this.resolverContract.resolve(normalized).then(function(result){
            if(result === that.ethers.constants.AddressZero)
              return null;
            return result;
          });
        }
      }

  /**
   * Finds the primary domain of an address, if the primary is not set, returns null
   *
   * @param _address The address to check
   * @returns primary domain
   */
  async lookupAddress(_address) {
        const that = this;
        return this.resolverContract.primary(_address).then(function(result){
          const domain = that.bytes32ToString(result);
          if(domain.length == 0)
            return null;
          return domain + ".og";
        });
      }

  /**
   * Sets the primary domain
   *
   * Note that the signer address must be the owner or the controller of the domain
   *
   * @param _name The domain to set as primary
   * @returns
   */
  async setPrimary(_name) {
        if(this.verifyIsNameOwner(_name, (await this.signer.getAddress()))){
          let nameBytes = this.domainToBytes32(_name);
          return this.resolverContract.setPrimary(nameBytes).then(function(result){
            return result;
          });
        }
        else{
          throw "Address is not the owner or controller";
        }
      }

  /**
   * Unsets the primary domain
   *
   * @returns
   */
  async unsetPrimary() {
        return this.resolverContract.unsetPrimary().then(function(result){
          return result;
        });
      }

  /**
   * Sets the controller
   *
   * Note that the signer address must be the owner or the controller of the domain
   *
   * @param _name The domain to set the controller for
   * @param _address The address to set as the controller
   * @returns
   */
  async setController(_name, _address) {
        let isUnwrappedOwner = await this.isUnwrappedOwner(_name);
        if(!isUnwrappedOwner[0]){
          throw isUnwrappedOwner[1];
        }
        else{
          let nameBytes = this.domainToBytes32(_name);
          return this.resolverContract.setController(nameBytes, _address).then(function(result){
            return result;
          });
        }
      }

  /**
   * Unsets the controller for a domain
   *
   * @param _name The domain for which to unset the controller
   * @returns
   */
  async unsetController(_name) {
        let isUnwrappedOwner = await this.isUnwrappedOwner(_name);
        if(!isUnwrappedOwner[0]){
          throw isUnwrappedOwner[1];
        }
        else{
          let nameBytes = this.domainToBytes32(_name);
          return this.resolverContract.unsetController(nameBytes).then(function(result){
            return result;
          });
        }
      }


  // --------------------------- WRAPPER ---------------------------

  /**
   * Creates a new wrapper
   *
   * @param _name The domain to create the wrapper for
   * @returns
   */
    async createWrapper(_name) {
      let isUnwrappedOwner = await this.isUnwrappedOwner(_name);
      if(!isUnwrappedOwner[0]){
        throw isUnwrappedOwner[1];
      }
      else{
        let nameBytes = this.domainToBytes32(_name);
        return this.wrapperContract.createWrapper(nameBytes).then(function(result){
          return result;
        });
      }
    }

  /**
   * Wraps an existing domain
   *
   * @param _name The domain to wrap
   * @returns
   */
    async wrap(_name) {
      let isUnwrappedOwner = await this.isUnwrappedOwner(_name);
      if(!isUnwrappedOwner[0]){
        throw isUnwrappedOwner[1];
      }
      else{
        let nameBytes = this.domainToBytes32(_name);
        return this.wrapperContract.wrap(nameBytes).then(function(result){
          return result;
        });
      }
    }

  /**
   * Waits for the wrapper to be created
   *
   * @param _name The domain for which to wait the wrapper to be created
   * @returns
   */
    async waitForWrap(_name) {
      let nameBytes = this.domainToBytes32(_name);
      let that = this;
      return this.wrapperContract.waitForWrap(nameBytes).then(function(result){
        if(result === that.ethers.constants.AddressZero)
          return null;
        else{
          return result;
        }
      });
    }

  /**
   * Unwraps a domain
   *
   * @param {string} _name The domain to unwrap
   * @returns
   */
    async unwrap(_name) {
      let isUnwrappedOwner = await this.isUnwrappedOwner(_name);
      if(isUnwrappedOwner.length == 3 && isUnwrappedOwner[2] == (await this.signer.getAddress())){
        let nameBytes = this.domainToBytes32(_name);
        let that = this;
        return that.wrapperContract.nameToId(nameBytes).then(function(tokenId){
          return that.wrapperContract.unwrap(tokenId).then(function(result){
            return result;
          });
        });
      }
      else if(isUnwrappedOwner[0] == true) {
        throw "This domain is unwrapped";
      } else {
        throw isUnwrappedOwner[1];
      }
    }

  /**
   * Transfers the given wrapped domain from one address to another
   *
   * @param {string} _from The address from which to transfer the domain
   * @param {string} _to The address to which to transfer the domain
   * @param {string} _name The domain to transfer
   * @returns
   */
    async safeTransferFrom(_from, _to, _name) {
      let isUnwrappedOwner = await this.isUnwrappedOwner(_name);
      if(isUnwrappedOwner.length == 3 && isUnwrappedOwner[2] == (await this.signer.getAddress())){
        let nameBytes = this.domainToBytes32(_name);
        let that = this;
        return that.wrapperContract.nameToId(nameBytes).then(function(tokenId){
          return that.wrapperContract["safeTransferFrom(address,address,uint256)"](_from, _to, tokenId).then(function(result){
            return result;
          });
        });

      }
      else if(isUnwrappedOwner[0] == true) {
        throw "This domain is unwrapped";
      } else {
        throw isUnwrappedOwner[1];
      }
    }


  //--------------------------- LINAGEE ---------------------------

  /**
   * Checks if a caller is the owner of the unwrapped domain returns [true,ownerAddress]
   * or [false, errorString]
   *
   * @param _name The domain for which to do the check
   * @returns an array [true/false, owner/error]
   */
    async isUnwrappedOwner(_name) {
      let owner = await this.owner(_name);
      if(owner == null || owner[0] != (await this.signer.getAddress())){
        return [false, "This domain is not yours"];
      }
      else if(owner[1] == "wrapped"){
        return [false, "This domain is wrapped", owner[0]];
      }
      return [true, owner[0]];
    }

  /**
   * Transfers the given unwrapped domain to the specified address
   *
   * @param _to The address to which to transfer the domain
   * @param _name The domain to transfer
   * @returns
   */
    async transfer(_to, _name) {
      let isUnwrappedOwner = await this.isUnwrappedOwner(_name);
      if(!isUnwrappedOwner[0]){
        throw isUnwrappedOwner[1];
      }
      else{
        let nameBytes = this.domainToBytes32(_name);
        return this.linageeContract.transfer(nameBytes, _to).then(function(result){
          return result;
        });
      }
    }

  /**
   * Reserves the specified domain
   *
   * @param _name The domain to reserve
   * @returns
   */
    async reserve(_name) {
      let owner = await this.owner(_name);
      if(owner != null){
        throw "Domain already registered";
      }
      else{
        let nameBytes = this.domainToBytes32(_name);
        return this.linageeContract.reserve(nameBytes).then(function(result){
          return result;
        });
      }
    }

  /**
   * Checks to see who owns the domain, and whether it is wrapped or not.  If
   * the domain isn't owned, returns null
   *
   * @param _name The domain for which to do the check
   * @returns an array [tokenOwner, wrapped/unwrapped]
   */
    async owner(_name) {
      let that = this;
      let nameBytes = this.domainToBytes32(_name);
      return this.linageeContract.owner(nameBytes).then(function(result){
        if (result === that.ethers.constants.AddressZero)
          return null;
        else {
          if(result != LNR.WRAPPER_ADDRESS) {
            return [result, "unwrapped"];
          } else {
            return that.wrapperContract.nameToId(nameBytes).then(function(tokenId){
              return that.wrapperContract.ownerOf(tokenId).then(function(tokenOwner){
                return [tokenOwner, "wrapped"];
              });
            });
          }
        }
      });
    }

}

export default LNR;
