import * as Cesium from 'cesium'

export class CesiumHelper {
    viewer: Cesium.Viewer | undefined
    constructor(containerId: string) {
        // 设置Cesium Ion默认token（如需自定义请替换为自己的token）
        Cesium.Ion.defaultAccessToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiJlNzU2NTdlOS00ODUzLTRiOGQtYmIxZi02OGE0NDkzNzViYmIiLCJpZCI6MTAzMTU5LCJpYXQiOjE2NTkzMTg3OTR9.WszZb_zTVRhyUwHcbV60dqLKQYDgSOIAFCxsnD2sFPk'

        const imageryProvider = new Cesium.UrlTemplateImageryProvider({
            url: "http://webrd02.is.autonavi.com/appmaptile?lang=zh_cn&size=1&scale=1&style=8&x={x}&y={y}&z={z}",
            credit: new Cesium.Credit('高德矢量地图'),
        });

        Cesium.createWorldTerrainAsync().then(terrainProvider => {
            this.viewer = new Cesium.Viewer(containerId, {
                baseLayer: new Cesium.ImageryLayer(imageryProvider, {}),
                terrainProvider: terrainProvider,
                shouldAnimate: true
            })
            this.viewer.scene.globe.depthTestAgainstTerrain = true
            this.viewer.scene.globe.enableLighting = true
            this.viewer.scene.globe.showWaterEffect = true
        }).catch(error => {
            console.error("Error creating world terrain: ", error);
        });
    }

    flyToBeijing() {
        if (!this.viewer) return
        this.viewer.camera.flyTo({
            destination: Cesium.Cartesian3.fromDegrees(116.4074, 39.9042, 10000),
            orientation: {
                heading: Cesium.Math.toRadians(0),
                pitch: Cesium.Math.toRadians(-45),
                roll: 0
            }
        })
    }

    // 其他Cesium相关功能可在此扩展
}