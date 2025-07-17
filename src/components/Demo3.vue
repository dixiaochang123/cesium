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

// 加载 GeoJSON 数据
async function loadGeoJson(url: string) {
  const response = await fetch(url);
  return await response.json();
}

// 设置多边形材质
function setPolygonMaterial(entities: any, material: any) {
  entities.entities.values.forEach((entity: any) => {
    if (entity.polygon) {
      entity.polygon.material = material;
      entity.polygon.extrudedHeight = new Cesium.ConstantProperty(5000);
      entity.polygon.height = new Cesium.ConstantProperty(0);
    }
  });
}

// 计算多边形中心点
function computePolygonCenter(points: any[]): [number, number] {
  let sumX = 0, sumY = 0, count = 0;
  points.forEach((coord: any) => {
    sumX += coord[0];
    sumY += coord[1];
    count++;
  });
  return [sumX / count, sumY / count];
}

// 添加标记点和名称标签
function addMarkerAndLabel(entities: any, lng: number, lat: number, name: string) {
  const markerEntity = entities.entities.add({
    position: Cesium.Cartesian3.fromDegrees(lng, lat, 5000),
    billboard: {
      image: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24"><circle cx="12" cy="12" r="6" fill="red" stroke="WHITE" stroke-width="2"/></svg>',
      width: 16,
      height: 16,
      scaleByDistance: new Cesium.NearFarScalar(1.5e2, 1.0, 2.0e6, 1.0),
      disableDepthTestDistance: Number.POSITIVE_INFINITY
    },
    show: true
  });
  const labelEntity = entities.entities.add({
    position: Cesium.Cartesian3.fromDegrees(lng, lat, 5000),
    label: {
      text: name,
      font: '14px sans-serif',
      fillColor: Cesium.Color.WHITE,
      outlineColor: Cesium.Color.BLACK,
      outlineWidth: 3,
      style: Cesium.LabelStyle.FILL_AND_OUTLINE,
      verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
      pixelOffset: new Cesium.Cartesian2(0, -10),
      disableDepthTestDistance: Number.POSITIVE_INFINITY,
      scaleByDistance: new Cesium.NearFarScalar(1.5e2, 1.0, 2.0e6, 1.0),
      pixelOffsetScaleByDistance: new Cesium.NearFarScalar(1.5e2, 1.0, 2.0e6, 1.0)
    },
    show: true
  });
  console.log('markerEntity', markerEntity, 'labelEntity', labelEntity);
}

// 处理所有区的中心点和标记
function processRegions(geojson: any, entities: any) {
  const nameSet = new Set<string>();
  geojson.features.forEach((feature: any) => {
    let polygons = [];
    if (feature.geometry.type === 'MultiPolygon') {
      polygons = feature.geometry.coordinates.flat(1);
    } else if (feature.geometry.type === 'Polygon') {
      polygons = feature.geometry.coordinates;
    }
    polygons.forEach((coords: any) => {
      let points = coords;
      if (Array.isArray(coords[0][0])) {
        points = coords[0];
      }
      const [centerLng, centerLat] = computePolygonCenter(points);
      if (feature.properties.name && !nameSet.has(feature.properties.name)) {
        nameSet.add(feature.properties.name);
        addMarkerAndLabel(entities, centerLng, centerLat, feature.properties.name);
      }
    });
  });
}

onMounted(async () => {
  const cesiumViewer: CesiumHelper = new CesiumHelper('cesiumContainer');
  const waitForViewer = () => new Promise<void>((resolve) => {
    const interval = setInterval(() => {
      if (cesiumViewer.viewer) {
        clearInterval(interval);
        resolve();
      }
    }, 100);
  });
  await waitForViewer();
  const geojson = await loadGeoJson(geojsonUrl);
  const entities = await Cesium.GeoJsonDataSource.load(geojson, {
    stroke: Cesium.Color.WHITE,
    fill: Cesium.Color.WHITE.withAlpha(0.01),
    clampToGround: false,
  });
  cesiumViewer.viewer?.dataSources.add(entities);
  const material = new Cesium.ImageMaterialProperty({
    image: textureUrl,
    repeat: new Cesium.Cartesian2(1.0, 1.0),
    transparent: false,
  });
  setPolygonMaterial(entities, material);
  cesiumViewer.viewer?.zoomTo(entities);
  processRegions(geojson, entities);
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