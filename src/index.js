
import {ethers} from 'ethers';
import {ens_normalize} from '@adraffy/ens-normalize';
import resolverAbi from '../abi/lnrResolverAbi.json';
import wrapperAbi from '../abi/wrapperAbi.json';
import linageeAbi from '../abi/linageeAbi.json';


class LNR {

    constructor(_ethers, _signer) {
      this.ethers = _ethers;
      this.signer = _signer;
      this.resolverAbi = resolverAbi;
      this.wrapperAbi = wrapperAbi;
      this.linageeAbi = linageeAbi;
      this.resolverAddress = "0x6023E55814DC00F094386d4eb7e17Ce49ab1A190";
      this.wrapperAddress =  "0x2Cc8342d7c8BFf5A213eb2cdE39DE9a59b3461A7";
      this.linageeAddress = "0x5564886ca2C518d1964E5FCea4f423b41Db9F561";
      this.resolverContract = new this.ethers.Contract(this.resolverAddress, this.resolverAbi, this.signer);
      this.wrapperContract = new this.ethers.Contract(this.wrapperAddress, this.wrapperAbi, this.signer);
      this.linageeContract = new this.ethers.Contract(this.linageeAddress, this.linageeAbi, this.signer);
    }

      //--------------HELPERS---------------------------

      bytes32ToString(_hex){
        return this.ethers.utils.toUtf8String(this.ethers.utils.arrayify(_hex).filter(n => n != 0));
      }

      stringToBytes32(_string){
        var result = this.ethers.utils.hexlify(this.ethers.utils.toUtf8Bytes(_string));
        while (result.length < 66) { result += '0'; }
        if (result.length !== 66) { throw new Error("invalid web3 implicit bytes32"); }
        return result;
      }

      domainToBytes32(_name){
        let checkIsValid = this.isValidDomain(_name);
        if(checkIsValid[0] == false){
          throw checkIsValid[1];
        }
        else{
          let normalized = checkIsValid[1];
          let nameOnly = normalized.slice(0,-3);
          return this.stringToBytes32(nameOnly);
        }
      }

      bytes32ToDomain(_name){
        return this.  bytes32ToString(_name) + ".og";
      }

      normalize(_name) {
        return ens_normalize(_name);
      }

      isValidDomain(_name){
        if(!_name || _name.length == 0)
          return [false, "Emptry string passed"];
        let normalized = this.normalize(_name);
        if((normalized.split(".").length - 1) > 1){
          return [false, 'Subdomains not supported at this time'];
        }
        else if(!normalized.endsWith(".og")){
          return [false,'Domain does not end in .og'];
        }
        else if(normalized.length > 35){
          return [false, 'Domain too long'];
        }
        else{
          return [true, normalized];
        }
      }

      //--------------RESOLVER---------------------------

      async verifyIsNameOwner(_name, _address) {
        const that = this;
        const nameBytes = this.domainToBytes32(_name);
        return this.resolverContract.verifyIsNameOwner(nameBytes, _address).then(function(result){
          return result;
        });
      }

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

      async lookupAddress(_address) {
        const that = this;
        return this.resolverContract.primary(_address).then(function(result){
          const domain = that.bytes32ToString(result);
          if(domain.length == 0)
            return null;
          return domain + ".og";
        });
      }

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

      async unsetPrimary() {
        return this.resolverContract.unsetPrimary().then(function(result){
          return result;
        });
      }

      async setController(_name, _address){
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


    //--------------WRAPPER---------------------------

    async createWrapper(_name){
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

    async wrap(_name){
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

    async unwrap(_name){
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
      else if(isUnwrappedOwner[0] == true){
        throw "This domain is unwrapped";
      }
      else {
        throw isUnwrappedOwner[1];
      }
    }

    async safeTransferFrom(_from, _to, _name){
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
      else if(isUnwrappedOwner[0] == true){
        throw "This domain is unwrapped";
      }
      else {
        throw isUnwrappedOwner[1];
      }
    }



    //--------------LINAGEE---------------------------

    async isUnwrappedOwner(_name){
      let owner = await this.owner(_name);
      if(owner == null || owner[0] != (await this.signer.getAddress())){
        return [false, "This domain is not yours"];
      }
      else if(owner[1] == "wrapped"){
        return [false, "This domain is wrapped", owner[0]];
      }
      return [true, owner[0]];
    }

    async transfer(_to, _name){
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

    async reserve(_name){
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

    async owner(_name){
      let that = this;
      let nameBytes = this.domainToBytes32(_name);
      return this.linageeContract.owner(nameBytes).then(function(result){
        if(result === that.ethers.constants.AddressZero)
          return null;
        else{
          if(result != that.wrapperAddress){
            return [result, "unwrapped"];
          }
          else{
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
