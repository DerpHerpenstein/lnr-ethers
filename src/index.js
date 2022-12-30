
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

      //--------------RESOLVER---------------------------

      bytes32ToString(_hex){
        return this.ethers.utils.toUtf8String(this.ethers.utils.arrayify(_hex).filter(n => n != 0));
      }


      stringToBytes32(_string){
        var result = this.ethers.utils.hexlify(this.ethers.utils.toUtf8Bytes(_string));
        while (result.length < 66) { result += '0'; }
        if (result.length !== 66) { throw new Error("invalid web3 implicit bytes32"); }
        return result;
      }


      normalize(_name) {
        return ens_normalize(_name);
      }


      isNormalized(_name) {
        let normalized = ens_normalize(_name);
        if((normalized.split(".").length - 1) > 1){
          return false;
        }
        else if(!normalized.endsWith(".og")){
          return false;
        }
        else if(_name === normalized)
          return true;
        else
          return false;
      }


      async resolveName(_name) {
        let normalized = ens_normalize(_name);

        if((normalized.split(".").length - 1) > 1){
          throw 'Subdomains not supported at this time';
        }
        else if(!normalized.endsWith(".og")){
          throw 'Domain does not end in .og';
        }
        else if(normalized.length > 35){
          throw 'Domain too long';
        }
        else{
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

}

export default LNR;
