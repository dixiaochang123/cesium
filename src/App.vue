<script setup lang="ts">// 使用 TypeScript 语法的 Vue 3 单文件组件脚本块
import { onMounted } from 'vue' // 导入 Vue 的生命周期钩子 onMounted
import { CesiumHelper } from './utils/CesiumUtils' // 导入自定义 Cesium 工具类
import * as Cesium from 'cesium' // 导入 Cesium 库所有内容

onMounted(() => { // 组件挂载后执行
  // 初始化Cesium地球
  const cesium = new CesiumHelper('cesiumContainer') // 创建 CesiumHelper 实例，绑定到 id 为 cesiumContainer 的 div

  function addPlaneAndCamera() { // 定义添加飞机和相机的方法
    if (!cesium.viewer) return // 如果 viewer 未初始化则返回
    // 加载gltf飞机模型，放在北京上空1000米
    const airplaneEntity = cesium.viewer.entities.add({ // 向实体集合添加飞机模型
      name: 'Airplane', // 实体名称
      position: Cesium.Cartesian3.fromDegrees(116.4074, 39.9042, 1000), // Cesium.Cartesian3.fromDegrees：根据经纬度和高度生成三维坐标
      orientation: Cesium.Transforms.headingPitchRollQuaternion( // Cesium.Transforms.headingPitchRollQuaternion：根据位置和欧拉角生成四元数朝向
        Cesium.Cartesian3.fromDegrees(116.4074, 39.9042, 1000), // 位置参数
        new Cesium.HeadingPitchRoll(Cesium.Math.toRadians(-90), 0, 0) // Cesium.HeadingPitchRoll：heading -90°，正前方朝北，俯仰0°，翻滚0°
      ), // 让飞机正前方朝向北方
      model: { // 模型相关参数
        uri: '/airplane.glb', // 模型文件路径
        scale: 10.0, // 缩放比例
        color: Cesium.Color.WHITE.withAlpha(1.0), // 保持白色以显示纹理
        colorBlendMode: Cesium.ColorBlendMode.MIX, // 混合模式
        colorBlendAmount: 0.5, // 颜色混合权重
        // 纹理文件路径如下
        // texture: '/rainbow_texture.svg'
      }
    })
    console.log(airplaneEntity) // 控制台输出飞机实体，便于调试
    // 相机在飞机正上方500米，俯视整个北京
    cesium.viewer.camera.flyTo({ // Cesium 相机飞行到指定位置
      destination: Cesium.Cartesian3.fromDegrees(116.4074, 39.9042, 1500), // Cesium.Cartesian3.fromDegrees：相机目标点经纬度和高度
      orientation: {
        heading: Cesium.Math.toRadians(0), // Cesium.Math.toRadians：正北方向，地图正向朝上
        pitch: Cesium.Math.toRadians(-90), // Cesium.Math.toRadians：垂直向下俯视
        roll: 0 // 无翻滚
      }
    })
    cesium.viewer.entities.add({
      position: Cesium.Cartesian3.fromDegrees(116.4074, 39.9042, 1000), // 文字位置
      label: {
        text: '北京', // 显示的文字
        font: '24px sans-serif', // 字体
        fillColor: Cesium.Color.YELLOW, // 字体颜色
        outlineColor: Cesium.Color.BLACK, // 描边颜色
        outlineWidth: 2, // 描边宽度
        style: Cesium.LabelStyle.FILL_AND_OUTLINE, // 填充和描边
        verticalOrigin: Cesium.VerticalOrigin.BOTTOM, // 垂直对齐方式
        pixelOffset: new Cesium.Cartesian2(0, -30), // 像素偏移
        disableDepthTestDistance: Number.POSITIVE_INFINITY // 保证文字不被地形遮挡
      }
    })
  }

  if (cesium.viewer) { // 如果 viewer 已初始化
    addPlaneAndCamera() // 添加飞机和相机
  } else { // 否则等待初始化完成
    const interval = setInterval(() => { // 每 100ms 检查一次
      if (cesium.viewer) { // 初始化完成后
        addPlaneAndCamera() // 添加飞机和相机
        clearInterval(interval) // 清除定时器
      }
    }, 100) // 100 毫秒间隔
  }
})
</script>

<template> <!-- Vue 模板部分 -->
  <div id="cesiumContainer"></div> <!-- Cesium 地球容器 -->
</template>

<style scoped>
 /* 局部样式，仅作用于本组件 */
 #cesiumContainer {
   width: 100vw;
   height: 100vh;
   margin: 0;
   padding: 0;
   overflow: hidden;
 }
</style>
