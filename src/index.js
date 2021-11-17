import {Marker, Panel, Popup, THREE} from 'mini-tokyo-3d';
import SVG from './svg/index';
import olympics from './olympics.json';
import './olympics.css';

const {DoubleSide, GLTFLoader, MeshPhongMaterial, TextureLoader} = THREE;

const DATA_URL = 'https://minitokyo3d.com/data';
const TRANSITION_DURATION = 300;
const REFRESH_INTERVAL = 60000;
const OLYMPIC_STADIUM_LNG_LAT = [139.7143859, 35.6778094];

function addColor(url, color) {
    const encodedColor = color.replace('#', '%23');
    return url.replace('%3e', ` fill=\'${encodedColor}\' stroke=\'${encodedColor}\'%3e`);
}

// Add style
const style = document.createElement('style');
style.type = 'text/css';
style.innerHTML = Object.keys(SVG).map(key => [
    `.${key}-icon {background-image: url("${addColor(SVG[key], '#fff')}");}`,
    `.olympics-marker.${key}-icon {background-image: url("${addColor(SVG[key], '#B11D33')}");}`,
    `.olympics-marker.active.${key}-icon, .olympics-marker:hover.${key}-icon {background-image: url("${addColor(SVG[key], '#33B5E5')}");}`
].join('\n')).join('\n');
document.head.appendChild(style);

class OlympicsLayer {

    constructor(options) {
        const me = this;

        me.id = options.id;
        me.minzoom = options.minzoom;
        me.maxzoom = options.maxzoom;
        me.type = 'three';
    }

    onAdd(map, context) {
        const me = this,
            scene = me.scene = context.scene,
            directionalLight = me.directionalLight = scene.getObjectByProperty('type', 'DirectionalLight'),
            ambientLight = me.ambientLight = scene.getObjectByProperty('type', 'AmbientLight'),
            loader = new GLTFLoader(),
            textureLoader = new TextureLoader(),
            texture = textureLoader.load(`${DATA_URL}/NewOlympicStadium2_d.png`),
            alphaMap = textureLoader.load(`${DATA_URL}/NewOlympicStadium2_a.png`),
            normalMap = textureLoader.load(`${DATA_URL}/NewOlympicStadium2_n.png`);

        texture.flipY = false;
        alphaMap.flipY = false;
        normalMap.flipY = false;

        loader.load(`${DATA_URL}/NewOlympicStadium2.glb`, gltf => {
            const stadium = gltf.scene,
                {position, scale, rotation} = stadium,
                modelPosition = map.getModelPosition(OLYMPIC_STADIUM_LNG_LAT),
                modelScale = map.getModelScale();

            stadium.traverse(child => {
                if (child.isMesh) {
                    child.material = new MeshPhongMaterial({
                        map: texture,
                        alphaMap,
                        normalMap,
                        alphaTest: 0.5,
                        transparent: true,
                        side: DoubleSide
                    });
                }
            });
            position.x = modelPosition.x;
            position.y = modelPosition.y;
            position.z = modelPosition.z;
            scale.x = scale.y = scale.z = modelScale;
            rotation.x = Math.PI / 2;
            rotation.y = -1.95;
            scene.add(stadium);
        });

        directionalLight.intensity = 1.8;
        ambientLight.intensity = .9;
    }

    setLightColor(color) {
        const me = this;

        me.directionalLight.color = color;
        me.ambientLight.color = color;
    }

    setOpacity(opacity) {
        this.scene.traverse(({isMesh, material}) => {
            if (isMesh) {
                material.opacity = opacity;
                material.alphaTest = opacity < 1 ? 0 : .5;
            }
        });
    }
}

class OlympicsControl {

    constructor(options) {
        const me = this,
            {lang, clock} = options;

        me._lang = lang;
        me._clock = clock;
        me._dict = {
            en: {
                'count-down': '$1<br>to Tokyo Olympics',
                'count-down-days': 'days',
                'count-up': 'Tokyo Olympics',
                'count-up-days': 'Day $1',
            },
            ja: {
                'count-down': '東京オリンピックまで<br>$1',
                'count-down-days': '日',
                'count-up': '東京オリンピック',
                'count-up-days': '$1日目'
            },
            ko: {
                'count-down': '도쿄올림픽까지<br>$1',
                'count-down-days': '일',
                'count-up': '도쿄올림픽',
                'count-up-days': '$1일차'
            },
            ne: {
                'count-down': 'टोकियो ओलम्पिक सम्म<br>$1',
                'count-down-days': 'दिन',
                'count-up': 'टोकियो ओलम्पिक',
                'count-up-days': 'दिवस $1'
            },
            th: {
                'count-down': '$1<br>สู่โตเกียวโอลิมปิก',
                'count-down-days': 'วัน',
                'count-up': 'โตเกียวโอลิมปิก',
                'count-up-days': 'วันที่ $1'
            },
            'zh-Hans': {
                'count-down': '距离东京奥运会还有<br>$1',
                'count-down-days': '天',
                'count-up': '东京奥运会',
                'count-up-days': '第$1天'
            },
            'zh-Hant': {
                'count-down': '距離東京奧運會還有<br>$1',
                'count-down-days': '天',
                'count-up': '東京奧運會',
                'count-up-days': '第$1天'
            }
        };
        me._timestamps = {
            olympics: {
                base: 1626966000000,  // 2021-07-23 00:00:00.000
                start: 1627038000000, // 2021-07-23 20:00:00.000
                end: 1628431200000    // 2021-08-08 23:00:00.000
            }
        };
    }

    getDefaultPosition() {
        return 'top-left';
    }

    onAdd(map) {
        const me = this;

        me._map = map;

        me._container = document.createElement('div');
        me._container.className = 'olympics-ctrl';
        me._container.style.display = 'none';

        const repeat = () => {
            const now = me._clock.getTime();

            if (!me._container) {
                return;
            }
            if (Math.floor(now / 1000) !== Math.floor(me._lastRefresh / 1000)) {
                me._refresh();
                me._lastRefresh = now;
            }
            requestAnimationFrame(repeat);
        };

        repeat();

        return me._container;
    }

    onRemove() {
        const me = this;

        me._container.parentNode.removeChild(me._container);
        me._container = undefined;
        me._map = undefined;
    }

    _refresh() {
        const me = this,
            dict = me._dict[me._lang] || me._dict.en,
            container = me._container,
            timestamps = me._timestamps,
            time = me._clock.getTime();

        if (time < timestamps.olympics.start) {
            const millis = timestamps.olympics.start - time + 1000,
                count = [
                    '<span class="olympics-count">',
                    Math.floor(millis / 86400000),
                    dict['count-down-days'],
                    ' ',
                    `0${Math.floor(millis / 3600000 % 24)}`.slice(-2),
                    ':',
                    `0${Math.floor(millis / 60000 % 60)}`.slice(-2),
                    ':',
                    `0${Math.floor(millis / 1000 % 60)}`.slice(-2),
                    '</span>'
                ].join('');

            container.innerHTML = dict['count-down'].replace('$1', count);
        } else if (time < timestamps.olympics.end) {
            const millis = time - timestamps.olympics.base;

            container.innerHTML = [
                dict['count-up'],
                '<br><span class="olympics-count">',
                dict['count-up-days'].replace('$1', Math.floor(millis / 86400000)),
                '</span>'
            ].join('');
        }

        container.style.display = time < timestamps.olympics.end ? 'block' : 'none';
    }

}

class OlympicsPanel extends Panel {

    constructor(options) {
        super(Object.assign({className: 'olympics-panel'}, options));
    }

    addTo(map) {
        const me = this,
            {lang} = map,
            {name, sports} = me._options.venue;

        me.setTitle(name[lang])
            .setHTML((sports || []).map(sport => [
                '<div class="olympics-sport-row">',
                `<div class="olympics-theme-${sport.theme}-1 olympics-icon ${sport.icon}-icon"></div>`,
                `<div class="olympics-theme-${sport.theme}-2 olympics-sport-title">${sport.name[lang] || sport.name.en}</div>`,
                '</div>',
                '<div">',
                (sport.schedule || []).map(item => [
                    '<div class="olympics-schedule-row">',
                    `<div>${item.date} ${item.start} - ${item.end}</div>`,
                    '<ul>',
                    (item.events || []).map(event => [
                        '<li>',
                        event[lang] || event.en,
                        '</li>'
                    ].join('')).join(''),
                    '</ul>',
                    '</div>'
                ].join('')).join(''),
                '</div>'
            ].join('')).join(''));
        return super.addTo(map);
    }

}

class OlympicsPlugin {

    constructor() {
        const me = this;

        me.id = 'olympics';
        me.name = {
            en: 'Tokyo 2020 Olympics',
            ja: '東京2020オリンピック',
            ko: '2020 도쿄 올림픽',
            ne: '२०२० टोक्यो ओलंपिक',
            th: 'โตเกียวโอลิมปิก 2020',
            'zh-Hans': '2020东京奥运',
            'zh-Hant': '2020東京奧運'
        };
        me.iconStyle = {
            backgroundSize: '34px',
            backgroundImage: `url("${addColor(SVG.torch, 'white')}")`
        };
        me.layer = new OlympicsLayer({id: me.id, minzoom: 14, maxzoom: 24});
        me.venues = {};
        me.markers = {};
        me._onSelection = me._onSelection.bind(me);
        me._onDeselection = me._onDeselection.bind(me);
        me._onViewModeChanged = me._onViewModeChanged.bind(me);
    }

    onAdd(map) {
        const me = this,
            {lang, clock} = me.map = map;

        map.addLayer(me.layer);
        me.olympicsCtrl = new OlympicsControl({lang, clock});
    }

    onRemove(map) {
        map.removeLayer(this.id);
    }

    onEnabled() {
        const me = this,
            {map, venues} = me;

        map.on('selection', me._onSelection);
        map.on('deselection', me._onDeselection);
        map.on('viewmode', me._onViewModeChanged);

        for (const item of olympics) {
            venues[item.id] = item;
        }
        me._addMarkers();
        map.getMapboxMap().addControl(me.olympicsCtrl);

        const repeat = () => {
            const now = map.clock.getTime();

            if (Math.floor(now / REFRESH_INTERVAL) !== Math.floor(me.lastRefresh / REFRESH_INTERVAL)) {
                me.layer.setLightColor(map.getLightColor());
                me.lastRefresh = now;
            }
            if (me.enabled) {
                requestAnimationFrame(repeat);
            }
        };

        repeat();
    }

    onDisabled() {
        const me = this,
            {map} = me;

        map.off('selection', me._onSelection);
        map.off('deselection', me._onDeselection);
        map.off('viewmode', me._onViewModeChanged);

        if (me.panel) {
            map.trackObject();
            me.panel.remove();
            delete me.panel;
        }

        for (const id of Object.keys(me.venues)) {
            delete me.venues[id];
        }
        for (const id of Object.keys(me.markers)) {
            me.markers[id].remove();
            delete me.markers[id];
        }
        map.getMapboxMap().removeControl(me.olympicsCtrl);
    }

    onVisibilityChanged(visible) {
        const me = this,
            {map} = me;

        if (!visible && me.panel) {
            map.trackObject();
        }
        for (const id of Object.keys(me.markers)) {
            me.markers[id].setVisibility(visible);
        }
        map.setLayerVisibility(me.id, visible ? 'visible' : 'none');
    }

    _addMarkers() {
        const me = this,
            {map, venues} = me,
            {lang} = map;

        for (const id of Object.keys(venues)) {
            const {center, zoom, bearing, pitch, name, sports, thumbnail} = venues[id],
                element = document.createElement('div'),
                selection = {id, selectionType: 'olympic-venue'};
            let popup;

            element.className = `olympics-marker ${sports[0].icon}-icon`;

            me.markers[id] = new Marker({element})
                .setLngLat(center)
                .addTo(map)
                .on('click', () => {
                    map.trackObject(selection);
                    map.setViewMode('ground');
                    map.getMapboxMap().flyTo({center, zoom, bearing, pitch});
                })
                .on('mouseenter', () => {
                    popup = new Popup()
                        .setLngLat(center)
                        .setHTML([
                            '<div class="thumbnail-image-container">',
                            '<div class="ball-pulse"><div></div><div></div><div></div></div>',
                            `<div class="thumbnail-image" style="background-image: url(\'${thumbnail}\');"></div>`,
                            '</div>',
                            `<div><strong>${name[lang]}</strong></div>`
                        ].join(''))
                        .addTo(map);
                })
                .on('mouseleave', () => {
                    if (popup) {
                        popup.remove();
                        popup = undefined;
                    }
                });
        }
    }

    _onSelection(event) {
        if (event.selectionType === 'olympic-venue') {
            const me = this,
                {map, venues} = me,
                {id} = event;

            me.markers[id].setActivity(true);
            me.panel = new OlympicsPanel({venue: venues[id]}).addTo(map);
        }
    }

    _onDeselection(event) {
        if (event.selectionType === 'olympic-venue') {
            const me = this,
                marker = me.markers[event.id];

            if (marker) {
                marker.setActivity(false);
            }
            if (me.panel) {
                me.panel.remove();
                delete me.panel;
            }
        }
    }

    _onViewModeChanged(event) {
        const me = this,
            opacities = event.mode === 'underground' ? [1, .1] : [.1, 1],
            start = performance.now();

        const repeat = () => {
            const elapsed = Math.min(performance.now() - start, TRANSITION_DURATION),
                opacity = opacities[0] + elapsed / TRANSITION_DURATION * (opacities[1] - opacities[0]);

            me.layer.setOpacity(opacity);

            if (elapsed < TRANSITION_DURATION) {
                requestAnimationFrame(repeat);
            }
        };

        repeat();
    }

}

export default function() {
    return new OlympicsPlugin();
}
