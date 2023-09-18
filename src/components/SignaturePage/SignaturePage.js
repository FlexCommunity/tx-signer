import { sleep } from "../../utils";
import { CONFIG } from "../../CONFIG";

const Web3 = window.Web3;
let web3 = new Web3();

const isDev = import.meta.env.DEV === true

export default {
  props: {
    sessionKey: String,
    sessionData: Object,
    sessionSigner: String,
  },
  data() {
    const curUrl = window.location.protocol + '//' + window.location.host + window.location.pathname
    return {
      apiUrl: CONFIG.apiUrl,
      pk: isDev ? (import.meta.env.VITE_FAT_DEV_PK || '') : '',
      sessionFrom: null,
      sessionQuantity: 0,
      txStacks: {},
      signedTxStacks: [],
      generationProgress100: null,
      sendingProgress100: null,
      sentTxAmount: null,
      sendingError: null,
      totalTx: null,
      info: {
        commitDate: import.meta.env.VITE_COMMIT_DATE,
        githubSha: import.meta.env.VITE_GITHUB_SHA,
        signerUrl: CONFIG.signerUrl,
        curUrl: curUrl,
        curUrlVerified: curUrl === CONFIG.signerUrl,
        apiPublicKey: CONFIG.apiPublicKey,
        sessionSignerVerified: this.sessionSigner === CONFIG.apiPublicKey,
      }
    }
  },
  computed: {
    canBack() {
      return this.sendingProgress100 === 100
    },
    canSend() {
      return this.generationProgress100 === 100 && this.sendingProgress100 < 100
    },
    canSign() {
      if (this.generationProgress100 !== null) {
        return false
      }
      if (this.pk && this.pkAddr?.toLowerCase() === this.sessionFrom?.toLowerCase()) {
        return true
      }
      return false
    },
    isSending() {
      return this.sendingProgress100 !== null && this.sendingProgress100 < 100
    },
    pkAddr() {
      if (this.pk) {
        try {
          const account = web3.eth.accounts.privateKeyToAccount(this.pk);
          return account.address
        } catch (e) {
          // Do nothing
        }
      }
      return null
    }
  },
  beforeMount: function () {
    web3 = new Web3(this.sessionData['rpc_url']);
    this.sessionFrom = this.sessionData['from']
    this.sessionQuantity = this.sessionData['quantity']
    this.sendSize = this.sessionData['send_size']

    this.lastSignedNonce = -1
    this.txStacks = this.sessionData['txsts'].map((txStack, txStackIndex) => {
      if (txStack['nonce_end'] && txStack['nonce_end'] > this.lastSignedNonce) {
        this.lastSignedNonce = txStack['nonce_end']
      }
      return {
        index: txStackIndex,
        ...txStack,
        signed: 0,
        generationProgress100: null,
      }
    })
  },
  methods: {
    signTxs: async function () {

      const acc = web3.eth.accounts.privateKeyToAccount(this.pk);

      const userNonce = this.sessionData['user_nonce']
      const chainId = this.sessionData['network_chain_id']

      const nonce = Math.max(userNonce, this.lastSignedNonce + 1)

      const quantity = this.sessionQuantity

      this.generationProgress100 = 0

      this.totalTx = quantity * this.txStacks.length
      let txi = 0

      await sleep(50)

      this.signedTxStacks = await Promise.all(this.txStacks.map(async (txStack, index) => {
        const txQueue = []
        const txConfigBase = JSON.parse(JSON.stringify(txStack['base_cfg']))

        for (let i = 0; i < quantity; i++) {
          txi++
          txStack.signed++
          this.generationProgress100 = Math.floor(txi / this.totalTx * 100)
          txStack.generationProgress100 = Math.floor(txStack.signed / quantity * 100)

          const txCfg = {
            ...txConfigBase,
            nonce: nonce + i,
            chainId: chainId,
          }

          let signedTx = await acc.signTransaction(txCfg);
          signedTx.stackIndex = index
          txQueue.push(signedTx)

          await sleep(50)
        }

        return txQueue

      }))

    },
    sendSignedTransactions: async function () {

      this.sendingProgress100 = 0
      this.sentTxAmount = 0
      this.sendingError = null

      const sendPack = async () => {
        if (rawTxPack.length > 0) {
          await fetch(CONFIG.apiUrl + `/sign_tx/`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Accept': 'application/json',
            },
            body: JSON.stringify({
              key: this.sessionKey,
              total_stacks: this.signedTxStacks.length,
              signed_txs: rawTxPack,
            }),
          })
            .then(resp => {
              if (!resp || resp.status !== 200) {
                this.sendingError = `Error "#${resp.status} ${resp.statusText}" while sending signed transactions`
              }
              return resp
            })
            .then(resp => resp.json())
            .catch(error => {
              console.error(error)
              this.sendingError = this.sendingError || 'Error while sending signed transactions:<br>' + error
            })

          this.sentTxAmount += rawTxPack.length
          this.sendingProgress100 = Math.floor(this.sentTxAmount / this.totalTx * 100)

          await sleep(50)

          rawTxPack.splice(0)

        }

      }

      const inspectPackSend = async () => {
        if (rawTxPack.length / this.signedTxStacks.length >= this.sendSize) {
          await sendPack()
        }
      }

      let rawTxPack = []
      for (let i = 0; i < this.sessionQuantity; i++) {
        for (const signedTxsList of this.signedTxStacks) {
          const signedTxs = signedTxsList[i]
          rawTxPack.push({ si: signedTxs.stackIndex, raw: signedTxs.rawTransaction });
        }
        await inspectPackSend()
        if (this.sendingError) {
          break;
        }
      }


      if (!this.sendingError) {
        // send last pack
        await sendPack()
      }

    }
  }
}
