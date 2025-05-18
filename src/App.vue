<script setup lang="ts">
import { onMounted } from 'vue'
import { CesiumHelper } from './utils/CesiumUtils'
import { ThreeHelper } from './utils/ThreeUtils'
import * as Cesium from 'cesium'
onMounted(() => {
  // 初始化Cesium地球并定位到北京
  const cesium = new CesiumHelper('cesiumContainer')
  // Cesium初始化后定位到北京上空1000米
  function flyPlaneAndCamera() {
    if (cesium.viewer) {
      cesium.viewer.camera.flyTo({
        destination:Cesium.Cartesian3.fromDegrees(116.4074, 39.9042, 1000),
        orientation: {
          heading:Cesium.Math.toRadians(0),
          pitch:Cesium.Math.toRadians(-90),
          roll: 0
        }
      })
    }
  }
  if (cesium.viewer) {
    flyPlaneAndCamera()
  } else {
    const interval = setInterval(() => {
      if (cesium.viewer) {
        flyPlaneAndCamera()
        clearInterval(interval)
      }
    }, 100)
  }

  // 集成Three.js飞机模型，放置在北京上空1000米
  setTimeout(() => {
    const container = document.getElementById('cesiumContainer')
    if (container) {
      const width = container.clientWidth
      const height = container.clientHeight
      const three = new ThreeHelper(width, height)
      three.loadGLTFModel('/airplane.gltf', (model) => {
        // 设置飞机在Three.js世界坐标原点（与Cesium北京上空1000米对齐）
        model.position.set(0, 0, 0)
        model.scale.set(0.1, 0.1, 0.1)
      })
      // Three.js相机在飞机正上方500米，俯视
      three.camera.position.set(0, 500, 0)
      three.camera.lookAt(0, 0, 0)
      three.renderer.setClearColor(0x000000, 0)
      container.appendChild(three.renderer.domElement)
      const animate = () => {
        requestAnimationFrame(animate)
        three.render()
      }
      animate()
    }
  }, 2000)
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
