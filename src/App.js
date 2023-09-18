import PageError from "./components/PageError.vue";
import SignaturePage from "./components/SignaturePage/SignaturePage.vue";
import SpinnerElement from "./components/SpinnerElement.vue";
import { CONFIG } from "./CONFIG";
import { getSessionKeyFromLocationUrl } from './utils';

const Web3 = window.Web3;

export default {
	components: { PageError, Spinner: SpinnerElement, SignaturePage },
	data() {
		return {
			error: null,
      errorMessage: '',
			loading: 1,
			loadingText: 'Loading...',
      sessionKey: null,
			sessionData: null,
			sessionSigner: null,
			initialHtml: null,
		}
	},
	beforeMount: function () {
		this.fetchSession().then(() => {
			this.loading--;
		}).catch((error) => {
			console.error(error)
			this.showError(`Session Loading Error`, error.message)
		})
	},
	methods: {
		fetchSession: async function () {

			this.sessionKey = getSessionKeyFromLocationUrl();
			if (!this.sessionKey) {
				throw new Error('No session.')
			}

			const sessionResp = await fetch(CONFIG.apiUrl + `/sign_tx/${this.sessionKey}?cb=${new Date().getTime()}`)

			if (sessionResp.status !== 200) {
				throw new Error(`Session Response error ${sessionResp.status}`)
			}
			let respDta = await sessionResp.json();
			if (!respDta.data || !respDta.sig) {
				throw new Error('Wrong session response body')
			}

      const web3 = new Web3();
			this.sessionSigner = web3.eth.accounts.recover(respDta.data, '0x' + respDta.sig)
			console.log(`Signer:`, this.sessionSigner)
			if (this.sessionSigner !== CONFIG.apiPublicKey) {
				throw new Error(`Wrong session signature: excepted ${CONFIG.apiPublicKey}, but got ${this.sessionSigner}`)
			}

			this.sessionData = JSON.parse(respDta.data);

		},
		showError(error, errorMessage) {
			this.error = error
			this.errorMessage = errorMessage
		}
	},
}
