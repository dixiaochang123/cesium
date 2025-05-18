import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

export class ThreeHelper {
  scene: THREE.Scene
  camera: THREE.PerspectiveCamera
  renderer: THREE.WebGLRenderer
  mesh: THREE.Mesh | null = null
  airplaneGroup: THREE.Group | null = null

  constructor(width: number, height: number) {
    this.scene = new THREE.Scene()
    this.camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000)
    this.renderer = new THREE.WebGLRenderer({ alpha: true })
    this.renderer.setSize(width, height)
    this.camera.position.set(0, 0, 10)
  }

  addTexturedPlane(textureUrl: string) {
    const geometry = new THREE.PlaneGeometry(2, 2)
    const texture = new THREE.TextureLoader().load(textureUrl)
    const material = new THREE.MeshBasicMaterial({ map: texture, transparent: true })
    this.mesh = new THREE.Mesh(geometry, material)
    this.scene.add(this.mesh)
  }

  loadGLTFModel(modelPath: string, callback?: (model: THREE.Group) => void) {
    const loader = new GLTFLoader();
    loader.load(
      modelPath,
      (gltf) => {
        this.airplaneGroup = gltf.scene;
        this.scene.add(this.airplaneGroup);
        if (callback) {
          callback(this.airplaneGroup);
        }
      },
      undefined,
      (error) => {
        console.error('An error happened while loading the GLTF model:', error);
      }
    );
  }

  render() {
    this.renderer.render(this.scene, this.camera)
  }

  // 其他Three.js相关功能可在此扩展
}