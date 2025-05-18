<script setup lang="ts">
import { onMounted } from 'vue'
import { CesiumHelper } from './utils/CesiumUtils'
import * as Cesium from 'cesium'

onMounted(() => {
  // 初始化Cesium地球
  const cesium = new CesiumHelper('cesiumContainer')

  function addPlaneAndCamera() {
    if (!cesium.viewer) return
    // 加载gltf飞机模型，放在北京上空1000米
    const airplaneEntity = cesium.viewer.entities.add({
      name: 'Airplane',
      position: Cesium.Cartesian3.fromDegrees(116.4074, 39.9042, 1000),
      model: {
        uri: '/airplane.glb',
        scale: 10.0
      }
    })
    console.log(airplaneEntity)
    // 相机在飞机正上方500米，俯视整个北京
    cesium.viewer.camera.flyTo({
      destination: Cesium.Cartesian3.fromDegrees(116.4074, 39.9042, 1500),
      orientation: {
        heading: Cesium.Math.toRadians(0),
        pitch: Cesium.Math.toRadians(-90),
        roll: 0
      }
    })
  }

  if (cesium.viewer) {
    addPlaneAndCamera()
  } else {
    const interval = setInterval(() => {
      if (cesium.viewer) {
        addPlaneAndCamera()
        clearInterval(interval)
      }
    }, 100)
  }
})
</script>

<template>
  <div id="cesiumContainer"></div>
</template>

<style scoped>
#cesiumContainer {
  width: 100vw;
  height: 100vh;
  margin: 0;
  padding: 0;
  overflow: hidden;
}
</style>
