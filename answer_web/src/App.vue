<script setup>
import { RouterView,RouterLink } from 'vue-router'
// 页面初次运行挂载
import {onMounted} from 'vue'
onMounted(()=>{
  if(!localStorage.getItem('status')){
    localStorage.setItem('status','false')
  }
})
</script>
<template>

  <RouterView />
</template>
<style scoped>
</style>
