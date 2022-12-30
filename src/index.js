
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
        return this.bytes32ToString(_name) + ".og";
      }


      normalize(_name) {
        return ens_normalize(_name);
      }

      isValidDomain(_name){
        let normalized = this.normalize(_name);
        if((normalized.split(".").length - 1) > 1){
          return [false, 'Subdomains not supported at this time']
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


    //--------------WRAPPER---------------------------

    //--------------LINAGEE---------------------------

    owner(_name){
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
