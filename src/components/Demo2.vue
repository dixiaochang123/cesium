<template>
  <div id="cesiumContainer"></div> <!-- Cesium Viewer 的容器 -->
</template>

<script setup lang="ts">
import { onMounted } from 'vue';
import { CesiumHelper } from '@/utils/CesiumUtils';

// 在组件挂载时初始化 Cesium Viewer
onMounted(() => {
  const cesiumViewer = new CesiumHelper('cesiumContainer');
});
</script>

<style scoped>
#cesiumContainer {
  width: 100vw;
  height: 100vh;
  position: fixed;
  left: 0;
  top: 0;
  z-index: 0;
}
</style>