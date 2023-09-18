<script src="./SignaturePage.js"></script>

<template>
  <nav class="navbar navbar-expand-md border-bottom bg-white fixed-top">
    <div class="container">
      <div class="navbar-brand d-flex align-items-center">
        <img src="/fat-logo.svg" class="mx-2" height="24">
        FAT Transaction Signer
      </div>
      <div id="navbarCollapse" class="collapse navbar-collapse">
        <ul class="navbar-nav me-auto mb-2 mb-md-0" />
        <div class="d-flex" role="search">
          <a class="btn btn-default" :href="apiUrl + '/sign_tx/' + sessionKey + '/back'">
            Cancel Signing
            <i class="fa-solid fa-xmark ms-1" />
          </a>
        </div>
      </div>
    </div>
  </nav>

  <div class="container py-5 mt-5">
    <div class="row mb-5">
      <div class="col-sm-6">
        <div class="card-body">
          <h6><strong>Schedule Information</strong></h6>
          <ul class="list-unstyled">
            <li class="list-group-item">
              Network: <strong>{{ sessionData['network_name'] }}</strong>
            </li>
            <li class="list-group-item">
              User's nonce: <strong>{{ sessionData['user_nonce'] }}</strong>
            </li>
          </ul>
        </div>
      </div>
      <div class="col-sm-6 mb-3">
        <div>
          <h6><strong>Signer</strong></h6>
          <ul class="list-unstyled">
            <li class="list-group-item">
              Signer Version: <strong>v1.0.0</strong>
            </li>
            <li class="list-group-item">
              GitHub Commit Date: <strong>{{ info.commitDate }}</strong>
            </li>
            <li class="list-group-item">
              GitHub Commit: <strong>{{ info.githubSha }}</strong>
            </li>
          </ul>

          <h6><strong>Site Verifications</strong></h6>
          <ul class="list-unstyled mb-5">
            <li class="list-group-item" :class="{'text-bg-danger rounded p-2': !info.curUrlVerified}">
              <i
                v-if="info.curUrlVerified"
                class="fa-solid fa-check fa-round-icon text-bg-success rounded-pill p-1 ms-1 me-1"
              />
              <i
                v-if="!info.curUrlVerified"
                class="fa-solid fa-xmark fa-round-icon text-danger bg-white rounded-pill p-1 me-1"
              />
              Verify Curren Url: <strong>{{ info.curUrl }}</strong>
              <div v-if="!info.curUrlVerified">
                The URL is wrong, must be "{{ info.signerUrl }}"
              </div>
            </li>
            <li class="list-group-item mt-2" :class="{'text-bg-danger rounded p-2': !info.sessionSignerVerified}">
              <i
                v-if="info.sessionSignerVerified"
                class="fa-solid fa-check fa-round-icon text-bg-success rounded-pill p-1 ms-1 me-1"
              />
              <i
                v-if="!info.sessionSignerVerified"
                class="fa-solid fa-xmark fa-round-icon text-danger bg-white rounded-pill p-1 me-1"
              />
              Verify API Signature: <strong>{{ sessionSigner }}</strong>
            </li>
          </ul>
        </div>
      </div>
    </div>

    <div class="card border-0 mb-5 rounded-4 overflow-hidden" :class="{ 'shadow': generationProgress100 === null }">
      <div class="card-header text-bg-primary-dark py-3">
        Private Key for
        <strong class="">{{ sessionFrom.toLowerCase() }}</strong>
      </div>
      <div class="card-body">
        <div class="pk-input block mb-3">
          <input
            id="privateKeyField"
            v-model="pk"
            type="email"
            class="form-control"
            placeholder="Place your Private key"
          >
        </div>

        <div class="pk-address-block mb-5 small">
          <i
            v-if="pkAddr && sessionFrom && pkAddr.toLowerCase()===sessionFrom.toLowerCase()"
            class="fa-solid fa-check text-bg-success rounded-pill p-1 ms-3 me-1"
          />
          Address of the key: {{ pkAddr || 'n/a' }}
          <div
            v-if="pkAddr && sessionFrom && pkAddr.toLowerCase()!==sessionFrom.toLowerCase()"
            class="alert alert-danger"
          >
            <i
              v-if="pkAddr && sessionFrom && pkAddr.toLowerCase()===sessionFrom.toLowerCase()"
              class="fa-solid fa-xmark text-bg-danger rounded-circle p-1 ms-1 me-1 text-center" style="min-width: 20px"
            />
            Address of the private key doesn't match the address from the schedule.
          </div>
        </div>

        <div class="generate-tx-block my-4 mt-5">
          <button class="btn btn-primary px-3 p-2" :disabled="!canSign" @click="signTxs">
            <span class="badge text-bg-light rounded-pill me-2">1</span>
            Generate Signed Transactions
          </button>

          <div class="my-3 px-3">
            <div v-if="generationProgress100===null" class="text-muted">
              Each transaction will be signed {{ sessionQuantity }} times.
            </div>

            <div v-if="generationProgress100!==null && generationProgress100 < 100">
              Generating and sign transactions...
              <div class="progress">
                <div
                  class="progress-bar progress-bar-striped progress-bar-animated" role="progressbar"
                  :style="{ width: generationProgress100 + '%' }" :aria-valuenow="generationProgress100"
                  aria-valuemin="0" aria-valuemax="100"
                />
              </div>
            </div>

            <div v-if="generationProgress100 === 100">
              <i v-if="generationProgress100===100" class="fa-solid fa-check text-bg-success rounded-pill p-1 me-1" />
              Transactions generated and signed successfully.
            </div>
          </div>
        </div>

        <div class="send-tx-block my-4 mt-5">
          <div class="my-4">
            <button class="btn btn-primary px-3 p-2" :disabled="!canSend" @click="sendSignedTransactions()">
              <span class="badge text-bg-light rounded-pill me-2">2</span>
              Send Signed Transactions
              <span
                v-if="isSending"
                class="spinner-border spinner-border-sm mx-2" role="status"
                aria-hidden="true"
              />
            </button>

            <div class="my-3 px-3">
              <div
                v-if="!isSending && canSend"
                class=" text-muted"
              >
                Now you can send signed transaction to FAT.
              </div>

              <div v-if="isSending && sendingProgress100 < 100">
                <div>Sending transactions...</div>
                <div class="progress">
                  <div
                    class="progress-bar progress-bar-striped progress-bar-animated" role="progressbar"
                    aria-label="Basic example"
                    :style="{ width: sendingProgress100 + '%' }" :aria-valuenow="sendingProgress100"
                    aria-valuemin="0" aria-valuemax="100"
                  />
                </div>

                <div class="mt-3 small text-muted">
                  Processed {{ sentTxAmount && sentTxAmount / signedTxStacks.length || 0 }} /
                  {{ totalTx / signedTxStacks.length }} signed transaction sets
                </div>
              </div>

              <div v-if="sendingProgress100 === 100">
                <div>
                  <i
                    v-if="pkAddr && sessionFrom && pkAddr.toLowerCase()===sessionFrom.toLowerCase()"
                    class="fa-solid fa-check text-bg-success rounded-pill p-1 me-1"
                  />
                  Transactions were sent successfully.
                </div>
              </div>

              <div
                v-if="sendingError"
                class="mt-3"
              >
                <div>
                  <div class="alert alert-danger" role="alert">
                    <div class="flex-grow-1 ms-3" v-html="sendingError" />
                    <hr>
                    <div class="mt-3">
                      You can try send signed transactions again.<br>
                      <button class="btn btn-primary mt-2" @click="sendSignedTransactions()">
                        Retry
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div v-if="canBack" class="back-to-scxhedule-block mt-5">
          <a class="btn btn-success px-3 p-2" :href="apiUrl + '/sign_tx/' + sessionKey + '/back_success'">
            Go To Schedule
            <i class="fa-solid fa-arrow-right" />
          </a>
        </div>
      </div>
    </div>

    <h2 class="text-center mb-3">
      Transactions To Sign
    </h2>

    <div
      v-for="(txStack, txStackIndex) in txStacks"
      :key="txStackIndex"
      class="card text-bg-light border-0 mb-3 rounded-4 overflow-hidden shadow"
    >
      <div class="card-body p-4">
        <dl class="row mb-0">
          <dt class="col-sm-3" style="font-weight: normal;">
            From
          </dt>
          <dd class="col-sm-9">
            {{ txStack['base_cfg']['from'] }}
          </dd>

          <dt class="col-sm-3" style="font-weight: normal;">
            To
          </dt>
          <dd class="col-sm-9">
            {{ txStack['info']['implement_name'] || txStack['info']['to_name'] }}
            <span class="text-muted">({{ txStack['base_cfg']['to'] }})</span>
          </dd>

          <dt class="col-sm-3" style="font-weight: normal;">
            Call Method
          </dt>
          <dd class="col-sm-9">
            {{ txStack['info']['method_info']['method_display'] }}
            <span class="text-muted">
              (Hash: {{ txStack['info']['method_info']['method_hash'] }})
            </span>
          </dd>
        </dl>
        <dl
          v-if="txStack['info']['method_args'].length"
          class="row mb-0"
        >
          <template v-for="(input, index) in txStack['info']['method_info']['abi']['inputs']" :key="index">
            <dt class="col-sm-3 text-end">
              {{ input.name }}
            </dt>
            <dd class="col-sm-9">
              {{ txStack['info']['method_args'][index] }}
            </dd>
          </template>
        </dl>
      </div>
      <div class="card-footer bg-light">
        <div class="text-end">
          <button
            :data-bs-target="'#tx-details-' + txStack.index"
            class="btn btn-outline-primary btn-sm dropdown-toggle" type="button" data-bs-toggle="collapse"
          >
            Raw Data
          </button>
        </div>
        <div
          :id="'tx-details-' + txStack.index"
          class="collapse mt-2 "
        >
          <div class="card-body">
            <table cellpadding="5">
              <tbody>
                <tr v-for="(value, key) in txStack['base_cfg']" :key="key">
                  <td class="text-end small" valign="top">
                    <strong>{{ key }}:</strong>
                  </td>
                  <td class="ps-2 small" style="word-break: break-all">
                    {{ value || '...' }}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
      <div
        v-if="txStack.generationProgress100!==null"
        class="card-footer bg-white"
      >
        <div class="row">
          <div class="col">
            <div v-if="txStack.generationProgress100!==null && txStack.generationProgress100 < 100">
              <div class="pt-1 pb-1">
                Generating and sign transactions...
              </div>
            </div>
            <div v-if="txStack.generationProgress100 === 100">
              <div class="pt-1 pb-1">
                <i class="fa-solid fa-check text-success" />
                Transactions generated and signed
              </div>
            </div>
          </div>
          <div class="col text-end">
            <div
              v-if="txStack.generationProgress100!==null && txStack.generationProgress100 < 100"
              class="pt-3 pb-3"
            >
              <div class="progress" style="height: 5px;">
                <div
                  class="progress-bar" role="progressbar" aria-label="Basic example"
                  :style="{ width: txStack.generationProgress100 + '%' }"
                  :aria-valuenow="txStack.generationProgress100"
                  aria-valuemin="0" aria-valuemax="100"
                />
              </div>
            </div>
            <div v-if="txStack.generationProgress100===100">
              <button
                :data-bs-target="'#raw-tx-' + txStack.index"
                aria-expanded="false" aria-controls="collapseExample"
                class="btn btn-outline-success btn-sm dropdown-toggle" type="button" data-bs-toggle="collapse"
              >
                Generated Transactions
              </button>
            </div>
          </div>
        </div>
        <div :id="'raw-tx-' + txStack.index" class="collapse ">
          <div
            v-for="(signedTxStack, stackIndex) in signedTxStacks"
            :key="stackIndex"
            style="word-break: break-all"
          >
            <div v-for="tx in signedTxStack" :key="tx.transactionHash" class="card small mt-3">
              <div class="card-header">
                <strong>Transaction Hash:</strong> {{ tx.transactionHash }}
              </div>
              <div class="card-body">
                <strong>Raw Transaction:</strong> {{ tx.rawTransaction }}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style src="./SignaturePage.scss"></style>
