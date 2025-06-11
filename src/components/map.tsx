import React, { useRef, useEffect, useState, Suspense } from "react";
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

// 添加設備檢測函數
const detectDevice = () => {
    const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera;
    
    // 檢測 iOS
    const isIOS = /iPad|iPhone|iPod/.test(userAgent) && !(window as any).MSStream;
    
    // 檢測 Android
    const isAndroid = /android/i.test(userAgent);
    
    // 檢測 Mac
    const isMac = /Mac|Macintosh/.test(userAgent);
    
    return {
        isIOS,
        isAndroid,
        isMac,
        isMobile: isIOS || isAndroid,
        isDesktop: !isIOS && !isAndroid
    };
};

// 建立導航連結的函數
const createNavigationLinks = (lat: number, lng: number, name: string) => {
    const encodedName = encodeURIComponent(name);
    const device = detectDevice();
    
    return {
        waze: {
            app: `waze://?ll=${lat},${lng}`,
            web: `https://waze.com/ul?ll=${lat},${lng}`,
            logo: require('../assets/icons/waze.png'),
            name: 'Waze'
        },
        googleMaps: {
            app: device.isIOS 
                ? `comgooglemaps://?center=${lat},${lng}&zoom=14&views=traffic` 
                : `geo:<${lat},${lng}>?q=${lat},${lng}(${encodedName})`,
            web: `https://maps.google.com/maps?q=${lat},${lng}`,
            logo: require('../assets/icons/google-maps.png'),
            name: 'Google Maps'
        },
        appleMaps: {
            app: `maps://?q=${lat},${lng}`,
            web: `https://maps.apple.com/?q=${lat},${lng}`,
            logo: require('../assets/icons/apple-maps.png'),
            name: 'Apple Maps'
        },
        amap: {
            app: device.isAndroid 
                ? `androidamap://viewMap?sourceApplication=appname&poiname=${encodedName}&lat=${lat}&lon=${lng}&dev=1`
                : `iosamap://viewMap?sourceApplication=appname&poiname=${encodedName}&lat=${lat}&lon=${lng}&dev=1`,
            web: `https://uri.amap.com/marker?position=${lng},${lat},${encodedName}&coordinate=wgs84&callnative=1`,
            logo: require('../assets/icons/amap.png'),
            name: '高德地圖'
        },
        baiduMap: {
            app: `baidumap://map/marker?location=${lat},${lng}&title=${encodedName}&coord_type=wgs84&output=html&src=webapp.baidu.openAPIdemo`,
            web: `https://api.map.baidu.com/marker?location=${lat},${lng}&title=${encodedName}&coord_type=wgs84&output=html&src=webapp.baidu.openAPIdemo`,
            logo: require('../assets/icons/baidu-maps.png'),
            name: '百度地圖'
        },
        //othermap using geo URI scheme
        otherMap: {
            app: `geo:<${lat},${lng}>?q=${lat},${lng}(${encodedName})`,
            web: `geo:<${lat},${lng}>?q=${lat},${lng}(${encodedName})`,
            logo: require('../assets/icons/other-maps.png'),
            name: '其他支援Geo URI的地圖'
        }
    };
};

// 處理 app 開啟的函數
const handleAppOpen = (appUrl: string, fallbackUrl: string) => {
    const device = detectDevice();
    
    if (device.isMobile) {
        // 手機設備使用改進的深度連結處理
        const iframe = document.createElement('iframe');
        iframe.style.display = 'none';
        iframe.src = appUrl;
        document.body.appendChild(iframe);
        
        const timer = setTimeout(() => {
            window.open(fallbackUrl, '_blank');
            document.body.removeChild(iframe);
        }, 1500);
        
        const cleanup = () => {
            clearTimeout(timer);
            if (iframe.parentNode) {
                document.body.removeChild(iframe);
            }
        };
        
        const onBlur = () => {
            cleanup();
            window.removeEventListener('blur', onBlur);
        };
        
        window.addEventListener('blur', onBlur);
        setTimeout(cleanup, 3000);
    } else {
        // 桌面設備直接開啟網頁版
        window.open(fallbackUrl, '_blank');
    }
};

function KmlMarkers({ kmlUrl }: { kmlUrl: string }) {
    const [markers, setMarkers] = useState<Array<{name: string, position: [number, number]}>>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const controller = new AbortController();
        
        const loadKmlWithFallback = async () => {
            setLoading(true);
            try {
                // 使用 AbortController 來支援取消請求
                const res = await fetch(kmlUrl, { 
                    signal: controller.signal,
                    cache: 'force-cache' // 強制使用快取
                });
                
                if (!res.ok) {
                    throw new Error(`HTTP ${res.status}`);
                }
                
                const kmlText = await res.text();
                
                // 使用 requestIdleCallback 來在瀏覽器空閒時解析
                if ('requestIdleCallback' in window) {
                    (window as any).requestIdleCallback(() => {
                        const parsedMarkers = parseKmlMarkers(kmlText);
                        setMarkers(parsedMarkers);
                        setLoading(false);
                    });
                } else {
                    // Fallback 使用 setTimeout
                    setTimeout(() => {
                        const parsedMarkers = parseKmlMarkers(kmlText);
                        setMarkers(parsedMarkers);
                        setLoading(false);
                    }, 0);
                }
            } catch (e) {
                if (e instanceof Error && e.name !== 'AbortError') {
                    console.error('KML 載入失敗:', e);
                    setLoading(false);
                }
            }
        };
        
        loadKmlWithFallback();
        
        return () => {
            controller.abort();
        };
    }, [kmlUrl]);

    // 生成 Popup 內容的函數
    const renderPopupContent = (marker: {name: string, position: [number, number]}) => {
        const [lat, lng] = marker.position;
        const navLinks = createNavigationLinks(lat, lng, marker.name);
        
        return (
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
                    <button 
                        onClick={(e) => {
                            e.preventDefault();
                            handleAppOpen(navLinks.otherMap.app, navLinks.otherMap.web);
                        }}
                        className="nav-button other"> 
                        <img 
                            src={navLinks.otherMap.logo} 
                            alt="其他地圖" 
                            className="nav-logo"
                            onError={(e) => {
                                e.currentTarget.style.display = 'none';
                                e.currentTarget.nextElementSibling!.textContent = '🌐 其他地圖';
                            }}
                        />
                        <span className="nav-text">{navLinks.otherMap.name}</span>
                    </button>
                </div>
            </div>
        );
    };

    if (loading) {
        return null; // 或者返回一個輕量的載入指示器
    }

    return (
        <Suspense fallback={<div>載入中...</div>}>
            <MarkerClusterGroup
                chunkedLoading
                iconCreateFunction={createClusterCustomIcon}
                maxClusterRadius={50}
                spiderfyOnMaxZoom={true}
                showCoverageOnHover={false}
                zoomToBoundsOnClick={true}
            >
                {markers.map((marker, index) => (
                    <Marker 
                        key={`${marker.position[0]}-${marker.position[1]}`} // 更好的 key
                        position={marker.position}
                    >
                        <Popup 
                            maxWidth={300} 
                            minWidth={250}
                        >
                            {renderPopupContent(marker)}
                        </Popup>
                    </Marker>
                ))}
            </MarkerClusterGroup>
        </Suspense>
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

    // 香港邊界
    const HK_BOUNDS: [[number, number], [number, number]] = [
        // Latitude 22°08' North and 22°35' North, 
        //  Longitude 113°49' East and 114°31' East
        [22.13, 113.81], // 西南角
        [22.59, 114.52]  // 東北角
        
    ];

    return (
        <MapContainer
            center={center || [22.3964, 114.1099]}
            zoom={zoom || 10}
            scrollWheelZoom={true}
            style={{ height: height || "99.9vh", width: width || "100%" }}
            preferCanvas={true}
            zoomControl={false}
            maxBounds={HK_BOUNDS} // 限制地圖邊界
            maxBoundsViscosity={1.0} // 防止拖拽出邊界
            minZoom={10} // 設定最小縮放級別
        >
            <TileLayer
                attribution='&copy; <a href="https://carto.com/attributions">CARTO</a> | &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
                updateWhenIdle={true}
                keepBuffer={1} // 進一步減少緩衝區
                bounds={HK_BOUNDS} // 限制圖層邊界
            />
            <Suspense fallback={null}>
                <SearchControl />
            </Suspense>
            <KmlMarkers kmlUrl={kmlUrl} />
        </MapContainer>
    );
};

export default MapComponent;