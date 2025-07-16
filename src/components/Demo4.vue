<template>
  <div id="threeContainer"></div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { Three } from '@/utils/ThreeUtils.ts';
import * as dat from 'dat.gui';
import { CSS2DRenderer, CSS2DObject } from 'three/examples/jsm/renderers/CSS2DRenderer.js';
const geojsonUrl = 'https://geo.datav.aliyun.com/areas_v3/bound/110000_full.json';

// 响应式变量
const state = reactive({
  geojson: null as any,
  features: [] as any[],
  width: 0,
  height: 0
});

let three: any = null;
let controls: any = null;
let labelRenderer: any = null;
let material: any = null;
let ambientLight: any = null;
let gui: any = null;

/**
 * 初始化 three.js 场景和渲染器。
 * @param {HTMLElement} container three.js 容器元素
 * @constructor xp
 * @time 2022-12-25
 */
function initThree(container: HTMLElement) {
  state.width = container.clientWidth;
  state.height = container.clientHeight;
  three = new Three(state.width, state.height);
  container.appendChild(three.renderer.domElement);
}

/**
 * 初始化环境光、方向光和 GUI 控制面板。
 * @constructor xp
 * @time 2022-12-25
 */
function initLightsAndGUI() {
  ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
  three.scene.add(ambientLight);
  gui = new dat.GUI();
  const lightControls = {
    ambientIntensity: 0.5,
    ambientColor: 0xffffff
  };
  const materialControls = {
    meshColor: 0x00ff00
  };
  gui.add(lightControls, 'ambientIntensity', 0, 1).name('环境光强度').onChange((value: any) => {
    ambientLight.intensity = value;
  });
  gui.addColor(lightControls, 'ambientColor').name('环境光颜色').onChange((value: any) => {
    ambientLight.color.set(value);
  });
  material = new THREE.MeshStandardMaterial({ color: 0xffffff });
  gui.addColor(materialControls, 'meshColor').name('模型颜色').onChange((value: any) => {
    material.color.set(value);
  });
  const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
  directionalLight.position.set(0, 1, 0);
  three.scene.add(directionalLight);
}

/**
 * 初始化轨道控制器。
 * @param {HTMLElement} container three.js 容器元素
 * @constructor xp
 * @time 2022-12-25
 */
function initControls(container: HTMLElement) {
  controls = new OrbitControls(three.camera, three.renderer.domElement);
  controls.screenSpacePanning = false;
  controls.maxPolarAngle = Math.PI / 2;
}

/**
 * 初始化 CSS2D 标签渲染器。
 * @param {HTMLElement} container three.js 容器元素
 * @constructor xp
 * @time 2022-12-25
 */
function initLabelRenderer(container: HTMLElement) {
  labelRenderer = new CSS2DRenderer();
  labelRenderer.setSize(state.width, state.height);
  labelRenderer.domElement.style.position = 'absolute';
  labelRenderer.domElement.style.top = '0px';
  labelRenderer.domElement.style.pointerEvents = 'none';
  container.appendChild(labelRenderer.domElement);
}
/**
 * 加载 GeoJSON 数据。
 * @param {string} url GeoJSON 文件 URL
 * @returns {Promise<any>}
 */
async function loadGeoJson(url: string) {
  const response = await fetch(url);
  return response.json();
}

/**
 * 计算 GeoJSON 边界范围。
 * @param {any} geojson GeoJSON 数据
 * @returns {{minX:number,minY:number,maxX:number,maxY:number}}
 * @constructor xp
 * @time 2022-12-25
 */
function processGeoJsonBounds(geojson: any) {
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  const processCoordinates = (coords: number[][]) => {
    coords.forEach(coord => {
      minX = Math.min(minX, coord[0]);
      minY = Math.min(minY, coord[1]);
      maxX = Math.max(maxX, coord[0]);
      maxY = Math.max(maxY, coord[1]);
    });
  };
  geojson.features.forEach((feature: any) => {
    if (feature.geometry && feature.geometry.type === 'MultiPolygon') {
      feature.geometry.coordinates.forEach((polygonCoords: any) => {
        polygonCoords.forEach((coords: number[][]) => {
          processCoordinates(coords);
        });
      });
    }
  });
  return { minX, minY, maxX, maxY };
}

/**
 * 创建区域模型和标签。
 * @param {any} geojson GeoJSON 数据
 * @param {number} centerX 中心点 X
 * @param {number} centerY 中心点 Y
 * @param {number} scale 缩放因子
 * @constructor xp
 * @time 2022-12-25
 */
function createRegionMeshesAndLabels(geojson: any, centerX: number, centerY: number, scale: number) {
  const nameSet = new Set<string>();
  // 用于事件拾取的 mesh 列表
  const regionMeshes: any[] = [];
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
          const extrudeSettings = { steps: 1, depth: 50, bevelEnabled: false };
          const geometry = new THREE.ExtrudeGeometry(shape, extrudeSettings);
          const mesh = new THREE.Mesh(geometry, material.clone());
          mesh.userData = { feature };
          three.scene.add(mesh);
          regionMeshes.push(mesh);
          // 绘制边界线
          const lineMaterial = new THREE.LineBasicMaterial({ color: 0xffffff });
          const points = coordinates.map((coord: number[]) => {
            const x = (coord[0] - centerX) * scale;
            const y = (coord[1] - centerY) * scale;
            return new THREE.Vector3(x, y, 50);
          });
          const lineGeometry = new THREE.BufferGeometry().setFromPoints(points);
          const line = new THREE.Line(lineGeometry, lineMaterial);
          three.scene.add(line);
          // 区域名称去重
          const name = feature.properties.name;
          if (name && !nameSet.has(name)) {
            nameSet.add(name);
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
            // 创建标记点
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
            // 创建文字
            const nameDiv = document.createElement('div');
            nameDiv.textContent = name;
            nameDiv.style.fontSize = '16px';
            nameDiv.style.fontWeight = 'bold';
            nameDiv.style.color = '#222';
            nameDiv.style.background = 'rgba(255,255,255,0.8)';
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
            labelObject.position.set(centroidX, centroidY, 55);
            three.scene.add(labelObject);
          }
        });
      });
    }
  });
  // 事件相关
  addRegionHoverEvents(regionMeshes);
}

/**
 * 添加区域鼠标悬停高亮事件。
 * @param {Array} regionMeshes 区域 mesh 列表
 * @constructor xp
 * @time 2022-12-25
 */
function addRegionHoverEvents(regionMeshes: any[]) {
  const raycaster = new THREE.Raycaster();
  const mouse = new THREE.Vector2();
  let lastHighlighted: any = null;
  let lastOriginalColor: any = null;
  let lastOriginalScale: any = null;
  let lastOriginalGeometry: any = null;
  const container = document.getElementById('threeContainer') as HTMLElement;
  if (!container) return;
  container.addEventListener('mousemove', (event) => {
    const rect = container.getBoundingClientRect();
    mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    raycaster.setFromCamera(mouse, three.camera);
    const intersects = raycaster.intersectObjects(regionMeshes);
    if (intersects.length > 0) {
      const mesh: any = intersects[0].object;
      if (lastHighlighted !== mesh) {
        if (lastHighlighted) {
          lastHighlighted.material.color.set(lastOriginalColor);
          lastHighlighted.geometry.dispose();
          lastHighlighted.geometry = lastOriginalGeometry;
        }
        lastHighlighted = mesh;
        lastOriginalColor = mesh.material.color.getHex();
        lastOriginalGeometry = mesh.geometry.clone();
        // 获取原 shape
        const shape = mesh.geometry.parameters && mesh.geometry.parameters.shapes ? mesh.geometry.parameters.shapes : null;
        if (shape) {
          const extrudeSettings = { steps: 1, depth: 80, bevelEnabled: false };
          mesh.geometry.dispose();
          mesh.geometry = new THREE.ExtrudeGeometry(shape, extrudeSettings);
        }
        mesh.material.color.set(0xffd700); // 高亮色（金色）
      }
    } else {
      if (lastHighlighted) {
        lastHighlighted.material.color.set(lastOriginalColor);
        lastHighlighted.geometry.dispose();
        lastHighlighted.geometry = lastOriginalGeometry;
        lastHighlighted = null;
      }
    }
  });
}

/**
 * 设置相机参数。
 * @constructor xp
 * @time 2022-12-25
 */
function setCamera() {
  three.camera.position.set(0, -500, 1500);
  three.camera.lookAt(0, 0, 0);
  three.camera.near = 0.1;
  three.camera.far = 5000;
  three.camera.updateProjectionMatrix();
}

/**
 * 动画循环与渲染。
 * @constructor xp
 * @time 2022-12-25
 */
function animate() {
  requestAnimationFrame(animate);
  controls.update();
  three.render();
  labelRenderer.render(three.scene, three.camera);
}

onMounted(async () => {
  const container = document.getElementById('threeContainer') as HTMLElement;
  if (!container) {
    console.error('threeContainer not found!');
    return;
  }
  initThree(container);
  initLightsAndGUI();
  initControls(container);
  initLabelRenderer(container);
  state.geojson = await loadGeoJson(geojsonUrl)
  const { minX, minY, maxX, maxY } = processGeoJsonBounds(state.geojson);
  const centerX = (minX + maxX) / 2;
  const centerY = (minY + maxY) / 2;
  const scale = 1000 / Math.max(maxX - minX, maxY - minY);
  createRegionMeshesAndLabels(state.geojson, centerX, centerY, scale);
  setCamera();
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