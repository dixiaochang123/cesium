import * as Cesium from 'cesium'

export class CesiumHelper {
    viewer: Cesium.Viewer | undefined
    constructor(containerId: string) {
        // 设置 Cesium Ion 默认 token（如需自定义请替换为自己的 token）
        Cesium.Ion.defaultAccessToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiJlNzU2NTdlOS00ODUzLTRiOGQtYmIxZi02OGE0NDkzNzViYmIiLCJpZCI6MTAzMTU5LCJpYXQiOjE2NTkzMTg3OTR9.WszZb_zTVRhyUwHcbV60dqLKQYDgSOIAFCxsnD2sFPk'

        // 创建高德地图影像图层
        const imageryProvider = new Cesium.UrlTemplateImageryProvider({
            url: "http://webrd02.is.autonavi.com/appmaptile?lang=zh_cn&size=1&scale=1&style=8&x={x}&y={y}&z={z}",
            credit: new Cesium.Credit('高德矢量地图'), // 设置地图版权信息
        });

        // 异步创建全球地形数据，并初始化 Cesium.Viewer
        Cesium.createWorldTerrainAsync().then(terrainProvider => {
            // 创建 Cesium 地球容器
            this.viewer = new Cesium.Viewer(containerId, {
                baseLayer: new Cesium.ImageryLayer(imageryProvider, {}), // 添加影像图层
                terrainProvider: terrainProvider, // 添加地形数据
                shouldAnimate: true // 启用动画
            })
            // 开启地形与模型的深度检测，防止穿模
            this.viewer.scene.globe.depthTestAgainstTerrain = true
            // 开启地球光照效果
            this.viewer.scene.globe.enableLighting = true
            // 开启水面特效
            this.viewer.scene.globe.showWaterEffect = true
        }).catch(error => {
            console.error("Error creating world terrain: ", error);
        });
    }

    flyToBeijing() {
        if (!this.viewer) return
        // 相机飞行到北京上空
        this.viewer.camera.flyTo({
            destination: Cesium.Cartesian3.fromDegrees(116.4074, 39.9042, 10000), // 经纬度+高度
            orientation: {
                heading: Cesium.Math.toRadians(0), // 朝向角度（弧度）
                pitch: Cesium.Math.toRadians(-45), // 俯仰角（弧度）
                roll: 0 // 翻滚角
            }
        })
    }

    // 其他Cesium相关功能可在此扩展
}