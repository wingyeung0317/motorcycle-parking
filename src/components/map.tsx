import React, { useRef, useEffect, useState } from "react";
import { MapContainer, TileLayer, useMap, Marker, Popup } from "react-leaflet";
import MarkerClusterGroup from 'react-leaflet-cluster';
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import "leaflet-geosearch/dist/geosearch.css";
import { GeoSearchControl, OpenStreetMapProvider } from "leaflet-geosearch";
import "./map.css";

// 解決 marker 圖示不顯示問題
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl:
        "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
    iconUrl:
        "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
    shadowUrl:
        "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

// 自定義聚合圖標
const createClusterCustomIcon = (cluster: any) => {
    return new L.DivIcon({
        html: `<span class="cluster-icon">${cluster.getChildCount()}</span>`,
        className: "custom-marker-cluster",
        iconSize: L.point(33, 33, true),
    });
};

function SearchControl() {
    const map = useMap();
    const controlRef = useRef<any>(null);

    React.useEffect(() => {
        const provider = new OpenStreetMapProvider({
            params: {
                viewbox: "113.817,22.15,114.433,22.57", // [minLon, minLat, maxLon, maxLat]
                bounded: 1,
            },
        });
        const searchControl = new (GeoSearchControl as any)({
            provider,
            style: "bar",
            showMarker: true,
            showPopup: true,
            autoClose: false,
            retainZoomLevel: false,
            animateZoom: true,
            keepResult: true,
        });
        controlRef.current = searchControl;
        map.addControl(searchControl);

        return () => {
            map.removeControl(searchControl);
        };
    }, [map]);

    return null;
}

// 解析 KML 檔案的函數
const parseKmlMarkers = (kmlText: string) => {
    try {
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(kmlText, "text/xml");
        
        // 檢查解析錯誤
        const parseError = xmlDoc.getElementsByTagName("parsererror");
        if (parseError.length > 0) {
            console.error("KML 解析錯誤:", parseError[0].textContent);
            return [];
        }
        
        const placemarks = Array.from(xmlDoc.getElementsByTagName("Placemark"));
        console.log("找到", placemarks.length, "個 Placemark");
        
        return placemarks.map((placemark, index) => {
            const nameElement = placemark.getElementsByTagName("name")[0];
            const name = nameElement ? nameElement.textContent || `停車位 ${index + 1}` : `停車位 ${index + 1}`;
            
            const coordinatesElement = placemark.getElementsByTagName("coordinates")[0];
            if (!coordinatesElement) {
                console.warn("Placemark 沒有座標:", placemark);
                return null;
            }
            
            const coordText = coordinatesElement.textContent?.trim() || "";
            const coords = coordText.split(",").map(Number);
            
            if (coords.length >= 2 && !isNaN(coords[0]) && !isNaN(coords[1])) {
                // KML 格式是 longitude,latitude
                return {
                    name,
                    position: [coords[1], coords[0]] as [number, number], // 轉換為 lat,lng
                };
            }
            
            console.warn("無效的座標:", coordText);
            return null;
        }).filter(Boolean) as Array<{name: string, position: [number, number]}>;
    } catch (error) {
        console.error("KML 解析失敗:", error);
        return [];
    }
};

// 建立導航連結的函數
const createNavigationLinks = (lat: number, lng: number, name: string) => {
    const encodedName = encodeURIComponent(name);
    
    return {
        waze: {
            app: `waze://?ll=${lat},${lng}&navigate=no`,
            web: `https://waze.com/ul?ll=${lat},${lng}&navigate=no&z=17`,
            logo: 'https://web.archive.org/web/20250516145432if_/https://lh3.googleusercontent.com/bS6WdjfrzW5ixvGvDNYelTpQ6rVvRpk03XN9QzxUIieePHBB7T6cdg-ltInbM6znRmFb0flVDM9_E11cij4985pxo69izhfVMx5ENYE=h400-w400',
            name: 'Waze'
        },
        googleMaps: {
            app: `comgooglemaps://?q=${lat},${lng}`,
            web: `https://www.google.com/maps?q=${lat},${lng}`,
            logo: 'https://web.archive.org/web/20250320202115if_/https://upload.wikimedia.org/wikipedia/commons/thumb/3/39/Google_Maps_icon_%282015-2020%29.svg/1024px-Google_Maps_icon_%282015-2020%29.svg.png',
            name: 'Google Maps'
        },
        appleMaps: {
            app: `maps://?q=${lat},${lng}`,
            web: `https://maps.apple.com/?q=${lat},${lng}`,
            logo: 'https://web.archive.org/web/20250515185329if_/https://www.apple.com/v/maps/d/images/overview/intro_icon__dfyvjc1ohbcm_large.png',
            name: 'Apple Maps'
        },
        amap: {
            app: `https://uri.amap.com/marker?position=${lng},${lat},${encodedName}&coordinate=wgs84&callnative=1`,
            web: `https://uri.amap.com/marker?position=${lng},${lat},${encodedName}&coordinate=wgs84&callnative=1`,
            logo: 'https://web.archive.org/web/20250429135923if_/https://play-lh.googleusercontent.com/vowJJfgvClf1lUptAPCY5cD11mI6bctdRGhA0e_irDC7izFGBJzbTfw-89QHgIbb3h7q',
            name: '高德地圖'
        },
        baiduMap: {
            app: `baidumap://map/marker?location=${lat},${lng}&title=${encodedName}&coord_type=wgs84&output=html&src=webapp.baidu.openAPIdemo`,
            web: `https://api.map.baidu.com/marker?location=${lat},${lng}&title=${encodedName}&coord_type=wgs84&output=html&src=webapp.baidu.openAPIdemo`,
            logo: 'https://web.archive.org/web/20250426233751if_/https://play-lh.googleusercontent.com/AqDPC657JlwJUG5oJ0k7PiUWGXGmmNmWRNORW6Wk8oetgeMqGIgTjp5yGOT0vfaXzu6P',
            name: '百度地圖'
        }
    };
};

// 處理 app 開啟的函數
const handleAppOpen = (appUrl: string, fallbackUrl: string) => {
    // 嘗試開啟 app
    window.location.href = appUrl;
    
    // 如果 app 沒有安裝，延遲後開啟網頁版
    setTimeout(() => {
        window.open(fallbackUrl, '_blank');
    }, 1000);
};

function KmlMarkers({ kmlUrl }: { kmlUrl: string }) {
    const [markers, setMarkers] = useState<Array<{name: string, position: [number, number]}>>([]);

    useEffect(() => {
        console.log("開始載入 KML:", kmlUrl);
        
        const loadKmlWithFallback = async () => {
            try {
                // 嘗試載入主要 URL
                const res = await fetch(kmlUrl);
                console.log("KML fetch 狀態:", res.status);
                
                if (!res.ok) {
                    throw new Error(`HTTP ${res.status}`);
                }
                
                const kmlText = await res.text();
                console.log("KML 內容長度:", kmlText.length);
                const parsedMarkers = parseKmlMarkers(kmlText);
                setMarkers(parsedMarkers);
                console.log("解析後的標記:", parsedMarkers);
            } catch (error) {
                console.warn('無法載入主要 KML URL:', error);
                console.log('嘗試載入本地 output.kml');
                
                try {
                    // 回退到本地檔案
                    const fallbackRes = await fetch('./output.kml');
                    
                    if (!fallbackRes.ok) {
                        throw new Error(`HTTP ${fallbackRes.status} - 本地檔案載入失敗`);
                    }
                    
                    const fallbackKmlText = await fallbackRes.text();
                    console.log("本地 KML 內容長度:", fallbackKmlText.length);
                    const fallbackMarkers = parseKmlMarkers(fallbackKmlText);
                    setMarkers(fallbackMarkers);
                    console.log("本地檔案解析後的標記:", fallbackMarkers);
                } catch (fallbackError) {
                    console.error('載入本地 KML 檔案也失敗:', fallbackError);
                }
            }
        };
        
        loadKmlWithFallback();
    }, [kmlUrl]);

    return (
        <MarkerClusterGroup
            chunkedLoading
            iconCreateFunction={createClusterCustomIcon}
            maxClusterRadius={50}
            spiderfyOnMaxZoom={true}
            showCoverageOnHover={false}
            zoomToBoundsOnClick={true}
        >
            {markers.map((marker, index) => {
                const [lat, lng] = marker.position;
                const navLinks = createNavigationLinks(lat, lng, marker.name);
                
                return (
                    <Marker key={index} position={marker.position}>
                        <Popup maxWidth={300} minWidth={250}>
                            <div className="popup-content">
                                <h3 className="popup-title">{marker.name}</h3>
                                <p className="popup-coordinates">
                                    座標: {lat.toFixed(6)}, {lng.toFixed(6)}
                                </p>
                                <div className="navigation-buttons">
                                    <button 
                                        onClick={(e) => {
                                            e.preventDefault();
                                            handleAppOpen(navLinks.waze.app, navLinks.waze.web);
                                        }}
                                        className="nav-button waze"
                                    >
                                        <img 
                                            src={navLinks.waze.logo} 
                                            alt="Waze" 
                                            className="nav-logo"
                                            onError={(e) => {
                                                e.currentTarget.style.display = 'none';
                                                e.currentTarget.nextElementSibling!.textContent = '🚗 Waze';
                                            }}
                                        />
                                        <span className="nav-text">{navLinks.waze.name}</span>
                                    </button>
                                    <button 
                                        onClick={(e) => {
                                            e.preventDefault();
                                            handleAppOpen(navLinks.googleMaps.app, navLinks.googleMaps.web);
                                        }}
                                        className="nav-button google"
                                    >
                                        <img 
                                            src={navLinks.googleMaps.logo} 
                                            alt="Google Maps" 
                                            className="nav-logo"
                                            onError={(e) => {
                                                e.currentTarget.style.display = 'none';
                                                e.currentTarget.nextElementSibling!.textContent = '🗺️ Google Maps';
                                            }}
                                        />
                                        <span className="nav-text">{navLinks.googleMaps.name}</span>
                                    </button>
                                    <button 
                                        onClick={(e) => {
                                            e.preventDefault();
                                            handleAppOpen(navLinks.appleMaps.app, navLinks.appleMaps.web);
                                        }}
                                        className="nav-button apple"
                                    >
                                        <img 
                                            src={navLinks.appleMaps.logo} 
                                            alt="Apple Maps" 
                                            className="nav-logo"
                                            onError={(e) => {
                                                e.currentTarget.style.display = 'none';
                                                e.currentTarget.nextElementSibling!.textContent = '🍎 Apple Maps';
                                            }}
                                        />
                                        <span className="nav-text">{navLinks.appleMaps.name}</span>
                                    </button>
                                    <button 
                                        onClick={(e) => {
                                            e.preventDefault();
                                            handleAppOpen(navLinks.amap.app, navLinks.amap.web);
                                        }}
                                        className="nav-button amap"
                                    >
                                        <img 
                                            src={navLinks.amap.logo} 
                                            alt="高德地圖" 
                                            className="nav-logo"
                                            onError={(e) => {
                                                e.currentTarget.style.display = 'none';
                                                e.currentTarget.nextElementSibling!.textContent = '🧭 高德地圖';
                                            }}
                                        />
                                        <span className="nav-text">{navLinks.amap.name}</span>
                                    </button>
                                    <button 
                                        onClick={(e) => {
                                            e.preventDefault();
                                            handleAppOpen(navLinks.baiduMap.app, navLinks.baiduMap.web);
                                        }}
                                        className="nav-button baidu"
                                    >
                                        <img 
                                            src={navLinks.baiduMap.logo} 
                                            alt="百度地圖" 
                                            className="nav-logo"
                                            onError={(e) => {
                                                e.currentTarget.style.display = 'none';
                                                e.currentTarget.nextElementSibling!.textContent = '📍 百度地圖';
                                            }}
                                        />
                                        <span className="nav-text">{navLinks.baiduMap.name}</span>
                                    </button>
                                </div>
                            </div>
                        </Popup>
                    </Marker>
                );
            })}
        </MarkerClusterGroup>
    );
}

interface MapProps {
    center?: [number, number];
    zoom?: number;
    height?: string;
    width?: string;
}

const MapComponent = (props: MapProps & { kmlUrl?: string }) => {
    const kmlUrl = props.kmlUrl || "https://raw.githubusercontent.com/wingyeung0317/-HKOSMP-KML-Google-Maps-/refs/heads/Automatic/motorcycleParking.kml";
    const { center, zoom, height, width } = props;

    return (
        <MapContainer
            center={center || [22.3964, 114.1099]}
            zoom={zoom || 11}
            scrollWheelZoom={true}
            style={{ height: height || "99.9vh", width: width || "100%" }}
        >
            <TileLayer
                attribution='&copy; <a href="https://carto.com/attributions">CARTO</a> | &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
            />
            <SearchControl />
            <KmlMarkers kmlUrl={kmlUrl} />
        </MapContainer>
    );
};

export default MapComponent;