<script setup lang="ts">
import { onMounted } from 'vue'
import { CesiumHelper } from '../utils/CesiumUtils'
import * as Cesium from 'cesium'

onMounted(() => {
  const cesium = new CesiumHelper('cesiumContainer')
  function addPlaneAndCamera() {
    if (!cesium.viewer) return
    const airplaneEntity = cesium.viewer.entities.add({
      name: 'Airplane',
      position: Cesium.Cartesian3.fromDegrees(116.4074, 39.9042, 1000),
      orientation: Cesium.Transforms.headingPitchRollQuaternion(
        Cesium.Cartesian3.fromDegrees(116.4074, 39.9042, 1000),
        new Cesium.HeadingPitchRoll(Cesium.Math.toRadians(-90), 0, 0)
      ),
      model: {
        uri: '/airplane.glb',
        scale: 10.0,
        color: Cesium.Color.WHITE.withAlpha(1.0),
        colorBlendMode: Cesium.ColorBlendMode.MIX,
        colorBlendAmount: 0.5,
      }
    })
    console.log(airplaneEntity)
    cesium.viewer.camera.flyTo({
      destination: Cesium.Cartesian3.fromDegrees(116.4074, 39.9042, 1500),
      orientation: {
        heading: Cesium.Math.toRadians(0),
        pitch: Cesium.Math.toRadians(-90),
        roll: 0
      }
    })
    cesium.viewer.entities.add({
      position: Cesium.Cartesian3.fromDegrees(116.4074, 39.9042, 1000),
      label: {
        text: '北京',
        font: '24px sans-serif',
        fillColor: Cesium.Color.YELLOW,
        outlineColor: Cesium.Color.BLACK,
        outlineWidth: 2,
        style: Cesium.LabelStyle.FILL_AND_OUTLINE,
        verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
        pixelOffset: new Cesium.Cartesian2(0, -30),
        disableDepthTestDistance: Number.POSITIVE_INFINITY
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