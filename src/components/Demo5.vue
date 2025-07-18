<template>
  <div id="container"></div>
</template>
<script setup lang="ts">
import { ref, onMounted, onUnmounted, nextTick } from "vue";
import AMapLoader from "@amap/amap-jsapi-loader";
const geojsonUrl = 'https://geo.datav.aliyun.com/areas_v3/bound/110000_full.json';

let map = ref<any>(null);
let loca = ref<any>(null);
const polygonLayer = ref<any>(null);
const lineLayer = ref<any>(null); // 用于边界线
const initMap = async (AMap: any) => {
  try {
    const container = document.getElementById('container');
    if (!container || !container.clientWidth || !container.clientHeight) {
      throw new Error('地图容器不可见或尺寸无效');
    }
    map.value = new AMap.Map("container", {
      viewMode: "3D",
      zoom: 8.5,
      pitch: 20,
      center: [116.397428, 39.90923],
      mapStyle: 'amap://styles/b011ca2e7128b3bdfbab7ba40bf37db4',//暗黑样式
      showBuildingBlock: false,
      showLabel: true
    });
    loca.value = new Loca.Container({
      map: map.value
    });

      // 加载GeoJSON数据
    const response = await fetch(geojsonUrl);
    const geoData = await response.json();
    createPrismLayer(geoData)
    // 创建白色边界线图层
    createBoundaryLines(geoData);
    
  } catch (error) {
    console.error('地图加载失败', error);
  }
}
const createPrismLayer = async (geoData: any) => {
    // 创建PolygonLayer
    polygonLayer.value = new Loca.PolygonLayer({
      loca: loca.value,
      zIndex: 10,
      opacity: 0.8,
      visible: true,
      hasSide: true,
      hasBottom: true,
      zooms: [3, 22]
    });
    // 创建数据源
    const source = new Loca.GeoJSONSource({
      data: geoData
    });
    polygonLayer.value.setSource(source);
    // 设置样式 - 为每个区设置高度和颜色
    polygonLayer.value.setStyle({
      topColor: '#4facfe',
      sideTopColor: '#4facfe',
      sideBottomColor: '#0a1929',
      height: 10000,
      altitude: 0,
    });
    // 添加图层
    loca.value.add(polygonLayer.value);
}
// 创建白色边界线
const createBoundaryLines = (geoData: any) => {
  lineLayer.value = new Loca.LineLayer({
    loca: loca.value,
    zIndex: 20, // 确保边界线在3D区域上方
    opacity: 1,
    visible: true,
    depth: false, // 禁用深度测试，使线条始终可见
    zooms: [3, 22]
  });
  
  // 提取边界线数据
  const lineFeatures = [];
  for (const feature of geoData.features) {
    const coordinates = feature.geometry.coordinates;
    for (const ring of coordinates) {
      lineFeatures.push({
        type: "Feature",
        properties: {
          name: feature.properties.name,
          height: 10000
        },
        geometry: {
          type: "LineString",
          coordinates: ring[0] // 只取外边界
        }
      });
    }
  }
  
  const lineSource = new Loca.GeoJSONSource({
    data: {
      type: "FeatureCollection",
      features: lineFeatures
    }
  });
  
  lineLayer.value.setSource(lineSource);
  
  // 设置线条样式
  lineLayer.value.setStyle({
    lineWidth: 1, // 线条宽度
    borderWidth: 0,
    color: '#ffffff', // 白色
    dashArray: [0, 0], // 实线
    altitude: (_: any, feature: any) => feature.properties.height + 10, // 略高于3D区域

  });
  
  loca.value.add(lineLayer.value);
};
onMounted(async () => {
  nextTick(() => {
    AMapLoader.load({
      key: "4f1ad1b6f5e6cec9ad527923798e1047",
      version: "2.0",
      plugins: [],
      Loca: {
        version: "2.0.0" // 必须使用精确版本号
      }
    })
      .then(initMap)
      .catch(console.error);
  });
});

onUnmounted(() => {
  loca.value?.destroy();
  map.value?.destroy();
});
</script>
<style scoped>
#container {
  width: 100vw;
  height: 100vh;
}
</style>