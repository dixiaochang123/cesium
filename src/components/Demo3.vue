<template>
  <div id="cesiumContainer"></div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue';
import * as Cesium from 'cesium';
import { CesiumHelper } from '@/utils/CesiumUtils';

const geojsonUrl = 'https://geo.datav.aliyun.com/areas_v3/bound/110000_full.json';
import textureUrl from '@/assets/tt.jpg';
onMounted(async () => {
  const cesiumViewer = new CesiumHelper('cesiumContainer');

  const waitForViewer = () => new Promise<void>((resolve) => {
    const interval = setInterval(() => {
      if (cesiumViewer.viewer) {
        clearInterval(interval);
        resolve();
      }
    }, 100);
  });

  await waitForViewer();

  const response = await fetch(geojsonUrl);
  const geojson = await response.json();

  const entities = await Cesium.GeoJsonDataSource.load(geojson, {
    stroke: Cesium.Color.WHITE,
    fill: Cesium.Color.WHITE.withAlpha(0.01),
    clampToGround: false,
  });

  cesiumViewer.viewer?.dataSources.add(entities);

  // 加载花纹图案的纹理贴图
  const material = new Cesium.ImageMaterialProperty({
    image: textureUrl,
    repeat: new Cesium.Cartesian2(1.0, 1.0),
    transparent: false,
    
  });

  // 给每个实体的polygon设置纹理材质
  entities.entities.values.forEach(entity => {
    if (entity.polygon) {
      entity.polygon.material = material;
      entity.polygon.extrudedHeight = new Cesium.ConstantProperty(5000);
      entity.polygon.height = new Cesium.ConstantProperty(0);
    }
  });

  // 确保viewer存在后再执行缩放
  cesiumViewer.viewer?.zoomTo(entities);
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