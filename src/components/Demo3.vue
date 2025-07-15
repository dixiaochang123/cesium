<template>
  <div id="map"></div> <!-- 地图容器 -->
</template>

<script setup lang="ts">
import { onMounted } from 'vue';
import * as Cesium from 'cesium';
import { CesiumHelper } from '../utils/CesiumUtils';

// 北京各区的geojson数据URL
const geojsonUrl = 'https://geo.datav.aliyun.com/areas_v3/bound/110000_full.json';

onMounted(async () => {
  const cesiumViewer: CesiumHelper = new CesiumHelper('map');

  // 等待viewer初始化
  const waitForViewer = () => new Promise<void>((resolve) => {
    const interval = setInterval(() => {
      if (cesiumViewer.viewer) {
        clearInterval(interval);
        resolve();
      }
    }, 100);
  });

  await waitForViewer();

  // 加载geojson数据
  const response = await fetch(geojsonUrl);
  const geojson = await response.json();

  // 将geojson转换为Cesium实体
  const entities = await Cesium.GeoJsonDataSource.load(geojson, {
    stroke: Cesium.Color.RED,
    fill: Cesium.Color.RED.withAlpha(0.3),
    strokeWidth: 2,
    clampToGround: false,
  });

  // 将实体添加到viewer
  cesiumViewer.viewer?.dataSources.add(entities);

  // 设置所有实体的高度，使其从地面开始有深度
  entities.entities.values.forEach(entity => {
    if (entity.polygon) {
      entity.polygon.extrudedHeight = new Cesium.ConstantProperty(10000); // 设置挤出高度为100米，形成立体模型
      entity.polygon.height = new Cesium.ConstantProperty(0); // 底部高度为地面高度
    }
  });

  // 缩放视图到实体范围
  cesiumViewer.viewer?.zoomTo(entities);
});
</script>

<style scoped>
#map {
  width: 100vw;
  height: 100vh;
  position: fixed;
  left: 0;
  top: 0;
  z-index: 0;
}
</style>