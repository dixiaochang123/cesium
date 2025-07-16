<template>
  <div class="header">
    <div>
      <h1 class="title">北京市行政区划3D可视化</h1>
      <p class="subtitle">基于CesiumJS的三维地理信息系统展示</p>
    </div>
  </div>
  <div class="info-panel">
    <h3>北京市行政区划信息</h3>
    <div class="info-content">
      <p>北京市总面积约16,410平方公里，常住人口超过2100万。全市下辖16个市辖区。</p>
      <p>本可视化使用CesiumJS展示了北京市行政区划的3D模型，边界线绘制在模型上方。</p>
    </div>
  </div>
  <div class="footer">
    数据来源：北京市地理信息公共服务平台 | 使用CesiumJS构建
  </div>
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

.header {
  position: absolute;
  top: 48px;
  left: 0;
  padding: 20px 30px;
  background: rgba(0, 20, 40, 0.85);
  z-index: 100;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
}

.title {
  font-size: 1.8rem;
  font-weight: bold;
  background: linear-gradient(90deg, #ff8a00, #e52e71);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
}

.subtitle {
  font-size: 1rem;
  opacity: 0.9;
  margin-top: 5px;
  color: #a0d2ff;
}

.info-panel {
  position: absolute;
  left: 0;
  bottom: 43px;
  z-index: 100;
  background: rgba(0, 20, 40, 0.85);
  padding: 15px;
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
  max-width: 360px;
  backdrop-filter: blur(10px);
}

.info-panel h3 {
  color: #4dabf7;
  margin-bottom: 12px;
  font-size: 1.3rem;
  border-bottom: 2px solid #339af0;
  padding-bottom: 8px;
}

.info-content {
  line-height: 1.5;
  color: #c5e3ff;
  font-size: 0.9rem;
}

.footer {
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
  padding: 12px;
  background: rgba(0, 0, 0, 0.7);
  text-align: center;
  font-size: 0.85rem;
  z-index: 100;
  color: #74c0fc;
}
</style>