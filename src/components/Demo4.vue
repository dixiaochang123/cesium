<template>
  <div id="threeContainer"></div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { ThreeHelper } from '@/utils/ThreeUtils.ts';
import * as dat from 'dat.gui';
import { CSS2DRenderer, CSS2DObject } from 'three/examples/jsm/renderers/CSS2DRenderer.js';
const geojsonUrl = 'https://geo.datav.aliyun.com/areas_v3/bound/110000_full.json';

onMounted(async () => {
  const container = document.getElementById('threeContainer') as HTMLElement;
  if (!container) {
    console.error('threeContainer not found!');
    return;
  }

  const width = container.clientWidth;
  const height = container.clientHeight;

  const threeHelper = new ThreeHelper(width, height);
  container.appendChild(threeHelper.renderer.domElement);

  // 新增 CSS2DRenderer
  const labelRenderer = new CSS2DRenderer();
  labelRenderer.setSize(width, height);
  labelRenderer.domElement.style.position = 'absolute';
  labelRenderer.domElement.style.top = '0px';
  labelRenderer.domElement.style.pointerEvents = 'none';
  container.appendChild(labelRenderer.domElement);

  // 添加环境光
  // 环境光控制
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.5); // 柔和的白光
  threeHelper.scene.add(ambientLight);

  // 创建控制面板
  const gui = new dat.GUI();
  console.log('dat.GUI instance:', gui);
  const lightControls = {
    ambientIntensity: 0.5,
    ambientColor: 0xffffff // 默认环境光颜色为白色
  };

  const materialControls = {
    meshColor: 0x485dcd // 默认材质颜色为绿色
  };

  gui.add(lightControls, 'ambientIntensity', 0, 1).name('环境光强度').onChange((value) => {
    ambientLight.intensity = value;
  });
  gui.addColor(lightControls, 'ambientColor').name('环境光颜色').onChange((value) => {
    ambientLight.color.set(value);
  });

  const material = new THREE.MeshStandardMaterial({ color: 0x485dcd });
  gui.addColor(materialControls, 'meshColor').name('模型颜色').onChange((value) => {
    material.color.set(value);
  });

  // 添加方向光
  const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8); // 模拟太阳光
  directionalLight.position.set(0, 1, 0); // 从上方照射
  threeHelper.scene.add(directionalLight);
  // 添加轨道控制器
  const controls = new OrbitControls(threeHelper.camera, threeHelper.renderer.domElement);
  controls.screenSpacePanning = false; // 禁止屏幕空间平移
  controls.maxPolarAngle = Math.PI / 2; // 限制垂直旋转角度

  // 加载GeoJSON数据
  const response = await fetch(geojsonUrl);
  const geojson = await response.json();
  // 计算GeoJSON的中心点和边界，用于归一化坐标
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  const processCoordinates = (coords: number[][]) => {
    coords.forEach(coord => {
      minX = Math.min(minX, coord[0]);
      minY = Math.min(minY, coord[1]);
      maxX = Math.max(maxX, coord[0]);
      maxY = Math.max(maxY, coord[1]);
    });
  };

  if (geojson.features) {
    geojson.features.forEach((feature: any) => {
      if (feature.geometry && feature.geometry.type === 'MultiPolygon') {
        feature.geometry.coordinates.forEach((polygonCoords: any) => {
          polygonCoords.forEach((coords: number[][]) => {
            processCoordinates(coords);
          });
        });
      }
    });
  }

  const centerX = (minX + maxX) / 2;
  const centerY = (minY + maxY) / 2;
  const scale = 1000 / Math.max(maxX - minX, maxY - minY); // 缩放因子，使模型适应场景大小
  // 去重 朝阳跟顺义有两个飞地，名字重复
  let names= []
  // 解析GeoJSON并创建Three.js模型
  if (geojson.features) {
    geojson.features.forEach((feature: any) => {
      if (feature.geometry && feature.geometry.type === 'MultiPolygon') {
        feature.geometry.coordinates.forEach((polygonCoords: any) => {
          polygonCoords.forEach((coordinates: number[][]) => {
            const shape = new THREE.Shape();
            coordinates.forEach((coord: number[], index: number) => {
              const x = (coord[0] - centerX) * scale;
              const y = (coord[1] - centerY) * scale;
              if (index === 0) {
                shape.moveTo(x, y);
              } else {
                shape.lineTo(x, y);
              }
            });

            const extrudeSettings = {
              steps: 1,
              depth: 50,
              bevelEnabled: false
            };

            const geometry = new THREE.ExtrudeGeometry(shape, extrudeSettings);
            const mesh = new THREE.Mesh(geometry, material);
            threeHelper.scene.add(mesh);

            // 绘制边界线
            const lineMaterial = new THREE.LineBasicMaterial({ color: 0xffffff }); // 白色线条
            const points = coordinates.map((coord: number[]) => {
              const x = (coord[0] - centerX) * scale;
              const y = (coord[1] - centerY) * scale;
              return new THREE.Vector3(x, y, 50); // 边界线在模型顶部
            });
            const lineGeometry = new THREE.BufferGeometry().setFromPoints(points);
            const line = new THREE.Line(lineGeometry, lineMaterial);
            threeHelper.scene.add(line);

            // 获取区域名称 (MultiPolygon 的名称通常在 feature.properties 中)
            const name = feature.properties.name;
            names.push(name)
            if (name) {
              // 计算多边形中心点
              let sumX = 0, sumY = 0, count = 0;
              coordinates.forEach((coord: number[]) => {
                sumX += coord[0];
                sumY += coord[1];
                count++;
              });
              const centroidX = (sumX / count - centerX) * scale;
              const centroidY = (sumY / count - centerY) * scale;

              // 创建label容器
              const labelDiv = document.createElement('div');
              labelDiv.style.position = 'relative';
              labelDiv.style.display = 'flex';
              labelDiv.style.flexDirection = 'column';
              labelDiv.style.alignItems = 'center';
              labelDiv.style.pointerEvents = 'none';
              labelDiv.style.width = 'max-content';

              // 创建标记点（在底部，作为定位锚点）
              const marker = document.createElement('div');
              marker.style.width = '12px';
              marker.style.height = '12px';
              marker.style.borderRadius = '50%';
              marker.style.background = '#e74c3c';
              marker.style.border = '2px solid #fff';
              marker.style.boxSizing = 'border-box';
              marker.style.marginTop = '0px';
              marker.style.marginBottom = '0px';
              marker.style.position = 'relative';
              marker.style.zIndex = '1';
              labelDiv.appendChild(marker);

              // 创建文字（绝对定位于标记点正上方）
              const nameDiv = document.createElement('div');
              nameDiv.textContent = name;
              nameDiv.style.fontSize = '14px';
              nameDiv.style.fontWeight = 'bold';
              nameDiv.style.color = '#ffffff';
              // nameDiv.style.background = 'rgba(255,255,255,0.8)';
              nameDiv.style.padding = '0 4px';
              nameDiv.style.borderRadius = '4px';
              nameDiv.style.lineHeight = '20px';
              nameDiv.style.position = 'absolute';
              nameDiv.style.left = '50%';
              nameDiv.style.transform = 'translateX(-50%)';
              nameDiv.style.bottom = '100%';
              nameDiv.style.marginBottom = '4px';
              nameDiv.style.whiteSpace = 'nowrap';
              nameDiv.style.zIndex = '2';
              labelDiv.appendChild(nameDiv);

              // 创建CSS2DObject
              const labelObject = new CSS2DObject(labelDiv);
              labelObject.position.set(centroidX, centroidY, 55); // 高于模型顶部
              if(names.indexOf(name) === names.lastIndexOf(name)){
                threeHelper.scene.add(labelObject);
              }
            }
          });
        });
      }
    });
  }

  // 调整相机位置以适应模型
  threeHelper.camera.position.set(0, -500, 1500);
  threeHelper.camera.lookAt(0, 0, 0);
  threeHelper.camera.near = 0.1;
  threeHelper.camera.far = 5000;
  threeHelper.camera.updateProjectionMatrix();

  function animate() {
    requestAnimationFrame(animate);
    controls.update();
    threeHelper.render();
    labelRenderer.render(threeHelper.scene, threeHelper.camera);
  }
  animate();
});
</script>

<style scoped>
#threeContainer {
  width: 100vw;
  height: 100vh;
  position: fixed;
  left: 0;
  top: 0;
  z-index: 0;
  /* 调整z-index，确保dat.GUI面板可见 */
}
</style>

<style>
/* dat.GUI 样式调整 */
.dg.main {
  z-index: 1 !important;
  /* 确保dat.GUI面板在最上层 */
  position: absolute;
  right: 0;
  top: 50px;
}
</style>