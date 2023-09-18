<script setup>
defineProps({
  label: {
    type: String,
    default: ''
  }
})
</script>

<template>
  <div id="page-loading" class="d-flex justify-content-center align-items-center">
    <div class="spinner-border" role="status">
      <span class="visually-hidden">Loading...</span>
    </div>
    <strong class="ms-3">{{ label }}</strong>
  </div>
</template>
