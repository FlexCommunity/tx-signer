<script setup>
import { onMounted } from 'vue'

defineProps({
  error: {
    type: String,
    default: '',
  },
  errorMessage: {
    type: String,
    default: '',
  }
})

onMounted(() => {
  const modal = new window.bootstrap.Modal('#exampleModal', { backdrop: 'static', keyboard: false })
  modal.show()
})

</script>

<template>
  <div id="exampleModal" class="modal fade" tabindex="-1" aria-labelledby="exampleModalLabel" aria-hidden="true">
    <div class="modal-dialog">
      <div class="modal-content">
        <div class="modal-header">
          <div class="text-center w-100">
            <strong class="text-danger">{{ error }}</strong>
          </div>
        </div>
        <div class="modal-body">
          <div class="alert alert-danger mb-0">
            <div class="text-start">
              <code>{{ errorMessage }}</code>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
<script setup>
</script>
