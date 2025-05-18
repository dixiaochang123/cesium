import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

export class ThreeHelper {
  scene: THREE.Scene
  camera: THREE.PerspectiveCamera
  renderer: THREE.WebGLRenderer
  mesh: THREE.Mesh | null = null
  airplaneGroup: THREE.Group | null = null

  constructor(width: number, height: number) {
    // 创建 Three.js 场景
    this.scene = new THREE.Scene()
    // 创建透视相机，参数分别为视场角、宽高比、近裁剪面、远裁剪面
    this.camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000)
    // 创建 WebGL 渲染器，并设置透明背景
    this.renderer = new THREE.WebGLRenderer({ alpha: true })
    // 设置渲染器尺寸
    this.renderer.setSize(width, height)
    // 设置相机初始位置
    this.camera.position.set(0, 0, 10)
  }

  addTexturedPlane(textureUrl: string) {
    // 创建一个 2x2 的平面几何体
    const geometry = new THREE.PlaneGeometry(2, 2)
    // 加载纹理图片
    const texture = new THREE.TextureLoader().load(textureUrl)
    // 创建基础材质并绑定纹理，开启透明
    const material = new THREE.MeshBasicMaterial({ map: texture, transparent: true })
    // 创建网格对象并添加到场景
    this.mesh = new THREE.Mesh(geometry, material)
    this.scene.add(this.mesh)
  }

  loadGLTFModel(modelPath: string, callback?: (model: THREE.Group) => void) {
    // 创建 GLTF 模型加载器
    const loader = new GLTFLoader();
    loader.load(
      modelPath,
      (gltf) => {
        // 加载完成后将模型添加到场景
        this.airplaneGroup = gltf.scene;
        this.scene.add(this.airplaneGroup);
        if (callback) {
          callback(this.airplaneGroup);
        }
      },
      undefined,
      (error) => {
        // 加载出错时输出错误信息
        console.error('An error happened while loading the GLTF model:', error);
      }
    );
  }

  render() {
    // 渲染当前场景和相机视角
    this.renderer.render(this.scene, this.camera)
  }

  // 其他Three.js相关功能可在此扩展
}