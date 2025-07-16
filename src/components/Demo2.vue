<template>
  <div id="cesiumContainer"></div> <!-- Cesium Viewer 的容器 -->
</template>

<script setup lang="ts">
import { onMounted } from 'vue';
import { CesiumHelper } from '@/utils/CesiumUtils';
import * as Cesium from 'cesium'; // 导入 Cesium 库

// 定义运行雪花粒子系统的异步函数
const snpwParticleSystemRun = async (cesiumViewer: CesiumHelper) => {
  // 检查 Cesium Viewer 是否已初始化
  if (!cesiumViewer.viewer) {
    console.error('Cesium Viewer is not initialized. Retrying...'); // 输出错误信息并重试
    setTimeout(() => snpwParticleSystemRun(cesiumViewer), 1000); // 如果未初始化，1秒后重试
    return;
  }

  // 创建雪花粒子系统
  const snowParticleSystem = await new Cesium.ParticleSystem({
    show: true, // 显示粒子系统
    image: '/snowflake.svg', // 使用雪花图片
    startColor: Cesium.Color.WHITE.withAlpha(0.7), // 粒子开始颜色
    endColor: Cesium.Color.WHITE.withAlpha(0.3), // 粒子结束颜色
    startScale: 0.5, // 粒子开始缩放
    endScale: 1.0, // 粒子结束缩放
    minimumParticleLife: 1.0, // 粒子最短生命周期
    maximumParticleLife: 2.0, // 粒子最长生命周期
    minimumSpeed: 5.0, // 粒子最小速度
    maximumSpeed: 10.0, // 粒子最大速度
    imageSize: new Cesium.Cartesian2(10.0, 10.0), // 粒子图片尺寸
    emissionRate: 10000.0, // 粒子发射率
    lifetime: 16.0, // 粒子系统生命周期
    emitter: new Cesium.CircleEmitter(100.0), // 增加发射器半径以覆盖整个北京
    modelMatrix: Cesium.Transforms.eastNorthUpToFixedFrame(
      Cesium.Cartesian3.fromDegrees(116.4074, 39.9042) // 北京的经纬度
    ),
    emitterModelMatrix: Cesium.Matrix4.fromTranslation(new Cesium.Cartesian3(0.0, 0.0, 100.0)) // 发射器模型矩阵
  });
  cesiumViewer.viewer.scene.primitives.add(snowParticleSystem); // 将粒子系统添加到场景中
  cesiumViewer.viewer.camera.flyTo({
    destination: Cesium.Cartesian3.fromDegrees(116.4074, 39.9042, 10000), // 相机飞到指定位置
    orientation: {
      heading: Cesium.Math.toRadians(0), // 相机朝向
      pitch: Cesium.Math.toRadians(-90), // 相机俯仰角
      roll: 0 // 相机翻滚角
    }
  });
  console.log(snowParticleSystem, cesiumViewer.viewer); // 输出调试信息
};

// 在组件挂载时初始化 Cesium Viewer
onMounted(() => {
  const cesiumViewer = new CesiumHelper('cesiumContainer');
  setTimeout(() => {
    snpwParticleSystemRun(cesiumViewer); // 延迟运行雪花粒子系统
  }, 2000);
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