<script src="./App.js"></script>

<template>
  <PageError v-if="error" :error="error" :error-message="errorMessage" />
  <Spinner v-if="loading > 0" :label="loadingText" />
  <SignaturePage
    v-if="!!sessionData"
    :session-key="sessionKey"
    :session-data="sessionData"
    :session-signer="sessionSigner"
  />
</template>

<style src="./App.scss"></style>
