<template>
  <div id="threeContainer"></div>
  <div class="control-panel">
    <div class="panel-title">控制面板</div>
    <div class="control-item">
      <label>贴图颜色：</label>
      <input type="color" v-model="COLORS.meshColor" />
    </div>
    <div class="control-item">
      <label>透明度：</label>
      <input type="range" v-model="COLORS.meshAlpha" min="0" max="1" step="0.1" />
      <span>{{ COLORS.meshAlpha }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, onMounted ,watch} from 'vue';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { Three } from '@/utils/ThreeUtils.ts';
import { CSS2DRenderer, CSS2DObject } from 'three/examples/jsm/renderers/CSS2DRenderer.js';
const geojsonUrl = 'https://geo.datav.aliyun.com/areas_v3/bound/110000_full.json';
import textureUrl from '@/assets/tt.jpg';

// 响应式变量
/**
 * 响应式状态对象
 * @type {Object}
 * @property {any} geojson - GeoJSON 数据对象
 * @property {Array} features - GeoJSON 特征数组
 * @property {number} width - 容器宽度
 * @property {number} height - 容器高度
 */
const state = reactive({
  geojson: null as any,
  features: [] as any[],
  width: 0,
  height: 0
});

/**
 * Three.js 实例对象
 * @type {any}
 */
let three: any = null;

/**
 * 轨道控制器实例
 * @type {any}
 */
let controls: any = null;

/**
 * CSS2D 标签渲染器实例
 * @type {any}
 */
let labelRenderer: any = null;

/**
 * 颜色和透明度配置对象
 * @type {Object}
 * @property {string} meshColor - 网格颜色
 * @property {number} meshAlpha - 网格透明度
 */
const COLORS = reactive({
  meshColor: '#ffffff',
  meshAlpha: 1
});

/**
 * 初始化 three.js 场景和渲染器
 * @param {HTMLElement} container - three.js 容器元素
 * @description 根据容器尺寸初始化 Three.js 场景和渲染器
 */
function initThree(container: HTMLElement) {
  state.width = container.clientWidth;
  state.height = container.clientHeight;
  three = new Three(state.width, state.height);
  container.appendChild(three.renderer.domElement);
}

/**
 * 初始化轨道控制器
 * @description 设置轨道控制器的基本参数，限制相机移动范围
 */
function initControls() {
  controls = new OrbitControls(three.camera, three.renderer.domElement);
  controls.screenSpacePanning = false;
  controls.maxPolarAngle = Math.PI / 2;
}

/**
 * 初始化 CSS2D 标签渲染器
 * @param {HTMLElement} container - three.js 容器元素
 * @description 创建并配置 CSS2D 标签渲染器，用于显示区域名称标签
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
 * 加载 GeoJSON 数据
 * @param {string} url - GeoJSON 文件的 URL
 * @returns {Promise<any>} GeoJSON 数据对象
 * @description 从指定 URL 异步加载 GeoJSON 数据
 */
async function loadGeoJson(url: string) {
  const response = await fetch(url);
  return response.json();
}

/**
 * 计算 GeoJSON 边界范围
 * @param {any} geojson - GeoJSON 数据对象
 * @returns {{minX: number, minY: number, maxX: number, maxY: number}} 边界范围对象
 * @description 计算 GeoJSON 数据中所有坐标点的边界范围
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
 * 创建区域模型和标签
 * @param {any} geojson - GeoJSON 数据对象
 * @param {number} centerX - 中心点 X 坐标
 * @param {number} centerY - 中心点 Y 坐标
 * @param {number} scale - 缩放因子
 * @description 根据 GeoJSON 数据创建 3D 区域模型、边界线和标签
 */
function createRegionMeshesAndLabels(geojson: any, centerX: number, centerY: number, scale: number) {
  const nameSet = new Set<string>();
  // 贴图加载器和贴图
  const textureLoader = new THREE.TextureLoader();
  const texture = textureLoader.load(textureUrl);
  texture.wrapS = THREE.ClampToEdgeWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  texture.repeat.set(1, 1);
  texture.flipY = false;
  texture.colorSpace = THREE.NoColorSpace;
  texture.colorSpace = 'srgb';
  // 调整gamma值使颜色更深
  three.renderer.outputColorSpace = THREE.SRGBColorSpace;
  three.renderer.gammaFactor = 2.2;
  three.renderer.gammaOutput = true;

  // 用于事件拾取的 mesh 列表
  const regionMeshes: any[] = [];
  geojson.features.forEach((feature: any) => {
    if (feature.geometry && feature.geometry.type === 'MultiPolygon') {
      feature.geometry.coordinates.forEach((polygonCoords: any) => {
        polygonCoords.forEach((coordinates: number[][]) => {
          const shape = new THREE.Shape();
          const hole = new THREE.Path();
          coordinates.forEach((coord: number[], index: number) => {
            const x = (coord[0] - centerX) * scale;
            const y = (coord[1] - centerY) * scale;
            if (index === 0) {
              shape.moveTo(x, y);
              hole.moveTo(x, y);
            } else {
              shape.lineTo(x, y);
              hole.lineTo(x, y);
            }
          });
          // shape.holes.push(hole);//镂空
          const extrudeSettings = { steps: 1, depth: 50, bevelEnabled: false };
          const geometry = new THREE.ExtrudeGeometry(shape, extrudeSettings);
          // 归一化 UV 坐标
          geometry.computeBoundingBox();
          const boundingBox = geometry.boundingBox!;
          const { min, max } = boundingBox;
          const offset = new THREE.Vector2(-min.x, -min.y);
          const range = new THREE.Vector2(max.x - min.x, max.y - min.y);
          const uvAttribute = geometry.attributes.uv;
          for (let i = 0; i < uvAttribute.count; i++) {
            const x = geometry.attributes.position.getX(i);
            const y = geometry.attributes.position.getY(i);
            uvAttribute.setXY(i, (x + offset.x) / range.x, (y + offset.y) / range.y);
          }
          // 贴图材质
          const meshMaterial = new THREE.MeshBasicMaterial({
            color: COLORS.meshColor,
            map: texture,
            transparent: true,
            opacity: COLORS.meshAlpha,
            side: THREE.FrontSide
          });
          const mesh = new THREE.Mesh(geometry, meshMaterial);
          mesh.userData = { feature };
          three.scene.add(mesh);
          regionMeshes.push(mesh);
          // 绘制边界线
          const lineMaterial = new THREE.LineBasicMaterial({ 
            color: 0xffffff,
            transparent: true,
            opacity: COLORS.meshAlpha
          });
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
 * 添加区域鼠标悬停高亮事件
 * @param {Array<THREE.Mesh>} regionMeshes - 区域网格对象数组
 * @description 为区域模型添加鼠标悬停效果，包括高亮显示和高度变化
 */
function addRegionHoverEvents(regionMeshes: any[]) {
  const raycaster = new THREE.Raycaster();
  const mouse = new THREE.Vector2();

  let lastHighlighted: any = null;
  let lastOriginalColor: any = null;
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
          const geometry = new THREE.ExtrudeGeometry(shape, extrudeSettings);
          // 归一化 UV 坐标
          geometry.computeBoundingBox();
          const { min, max } = geometry.boundingBox!;
          const offset = new THREE.Vector2(-min.x, -min.y);
          const range = new THREE.Vector2(max.x - min.x, max.y - min.y);
          const uvAttribute = geometry.attributes.uv;
          for (let i = 0; i < uvAttribute.count; i++) {
            const x = geometry.attributes.position.getX(i);
            const y = geometry.attributes.position.getY(i);
            uvAttribute.setXY(i, (x + offset.x) / range.x, (y + offset.y) / range.y);
          }
          mesh.geometry.dispose();
          mesh.geometry = geometry;
        }
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
 * 设置相机参数
 * @description 配置相机的位置、视角和投影参数
 */
function setCamera() {
  three.camera.position.set(0, -500, 1500);
  three.camera.lookAt(0, 0, 0);
  three.camera.near = 0.1;
  three.camera.far = 5000;
  three.camera.updateProjectionMatrix();
}

/**
 * 动画循环与渲染
 * @description 实现场景的连续渲染，更新控制器状态和标签渲染
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
  initControls();
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
// 只保留mesh相关的监听
watch(() => [COLORS.meshColor, COLORS.meshAlpha], ([color, alpha]) => {
  three.scene.traverse((obj: any) => {
    if (obj.isMesh && obj.material) {
      obj.material.color.set(color);
      obj.material.transparent = true;
      obj.material.opacity = alpha;
    }
  });
});
</script>


<style scoped>
.control-panel {
  position: fixed;
  top: 50px;
  right: 20px;
  background: rgba(255, 255, 255, 0.9);
  padding: 15px;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  z-index: 1;
  width: 240px;
}
.panel-title {
  font-size: 18px;
  font-weight: bold;
  color: #000;
  margin-bottom: 8px;
  letter-spacing: 1px;
  border-bottom: 2px solid #339af0;
  padding-bottom: 8px;
}
.control-item {
  margin-bottom: 10px;
  display: flex;
  justify-content: flex-start;
  align-items: center;
}

.control-item:last-child {
  margin-bottom: 0;
}

.control-item label {
  display: block;
  margin-bottom: 5px;
  color: #333;
  font-size: 14px;
  width: 70px;
  text-align: right;
}

.control-item input[type="range"] {
  width: 150px;
  margin-right: 10px;
}

.control-item input[type="color"] {
  width: 28px;
  height: 30px;
  padding: 0;
  border: none;
  border-radius: 4px;
}

.control-item span {
  font-size: 14px;
  color: #666;
}

#threeContainer {
  width: 100vw;
  height: 100vh;
  position: fixed;
  left: 0;
  top: 0;
  z-index: 0;
}
</style>