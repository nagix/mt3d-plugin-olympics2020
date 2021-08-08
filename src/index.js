import {Marker, Panel, Plugin, Popup, ThreeLayer, TextureLoader, MeshPhongMaterial, GLTFLoader} from 'mini-tokyo-3d';
import SVG from './svg/index';
import olympics from './olympics.json';

const DATA_URL = 'https://minitokyo3d.com/data';
const TRANSITION_DURATION = 300;
const REFRESH_INTERVAL = 60000;
const OLYMPIC_STADIUM_LNG_LAT = [139.7143859, 35.6778094];

const styleHTML = `
    .olympics-panel {
        height: 262px !important;
    }
    .olympics-panel.collapsed {
        height: 50px !important;
    }
    .olympics-panel.closed {
        height: 0 !important;
    }
    .olympics-sport-row {
        display: table;
        width: 100%;
        margin: 6px 0;
    }
    .olympics-sport-row>div {
        display: table-cell;
        height: 38px;
    }
    .olympics-sport-title {
        padding-left: 6px;
        font-weight: bold;
        line-height: 38px;
    }
    .olympics-icon {
        width: 38px;
        height: 38px;
        background: no-repeat center/32px;
    }
    .olympics-schedule-row {
        padding: 6px 0;
    }
    .olympics-schedule-row:hover {
        background-color: rgba(102, 102, 102, 0.7);
    }
    .olympics-schedule-row ul {
        margin: 6px 0;
        padding-left: 24px;
    }
    .olympics-marker {
        width: 40px;
        height: 40px;
        border: 2px solid #B11D33;
        border-radius: 50%;
        background: white no-repeat center/34px;
        cursor: pointer;
    }
    .olympics-marker.active, .olympics-marker:hover {
        border-color: #33B5E5;
    }
    .olympics-theme-kurenai-1 {
        background-color: #782E2F;
    }
    .olympics-theme-kurenai-2 {
        background: linear-gradient(180deg, #B82D2F 0%, #B82D2F 60%, #922430 60%, #922430 100%);
    }
    .olympics-theme-ai-1 {
        background-color: #1B3563;
    }
    .olympics-theme-ai-2 {
        background: linear-gradient(180deg, #3982B7 0%, #3982B7 60%, #1E4B94 60%, #1E4B94 100%);
    }
    .olympics-theme-fuji-1 {
        background-color: #592860;
    }
    .olympics-theme-fuji-2 {
        background: linear-gradient(180deg, #804487 0%, #804487 60%, #AA4D84 60%, #AA4D84 100%);
    }
    .olympics-theme-matsuba-1 {
        background-color: #245259;
    }
    .olympics-theme-matsuba-2 {
        background: linear-gradient(180deg, #3F683D 0%, #3F683D 60%, #2A6261 60%, #2A6261 100%);
    }
    .olympics-ctrl {
        margin-top: 10px;
        margin-left: 10px;
        padding: 10px;
        border-radius: 3px;
        background-color: rgba(0, 0, 0, 0.7);
        box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
        color: #fff;
        pointer-events: auto;
    }
    .olympics-count {
        display: inline-block;
        font-size: 150%;
        padding: 2px 6px;
        border-radius: 3px;
        background-color: #B11D33;
    }
`;

function addColor(url, color) {
    const encodedColor = color.replace('#', '%23');
    return url.replace('%3e', ` fill=\'${encodedColor}\' stroke=\'${encodedColor}\'%3e`);
}

// Add style
const style = document.createElement('style');
style.innerHTML = [
    styleHTML,
    ...Object.keys(SVG).map(key => [
        `.${key}-icon {background-image: url("${addColor(SVG[key], '#fff')}");}`,
        `.olympics-marker.${key}-icon {background-image: url("${addColor(SVG[key], '#B11D33')}");}`,
        `.olympics-marker.active.${key}-icon, .olympics-marker:hover.${key}-icon {background-image: url("${addColor(SVG[key], '#33B5E5')}");}`
    ].join('\n'))
].join('\n');
document.head.appendChild(style);

class OlympicsLayer extends ThreeLayer {

    onAdd(map, gl) {
        super.onAdd(map, gl);

        const me = this,
            loader = new GLTFLoader(),
            texture = new TextureLoader().load(`${DATA_URL}/NewOlympicStadium2_d.png`),
            alphaMap = new TextureLoader().load(`${DATA_URL}/NewOlympicStadium2_a.png`),
            normalMap = new TextureLoader().load(`${DATA_URL}/NewOlympicStadium2_n.png`);

        texture.flipY = false;
        alphaMap.flipY = false;
        normalMap.flipY = false;

        loader.load(`${DATA_URL}/NewOlympicStadium2.glb`, gltf => {
            const scene = gltf.scene,
                {position, scale, rotation} = scene,
                modelPosition = me.getModelPosition(OLYMPIC_STADIUM_LNG_LAT),
                modelScale = me.getModelScale();

            scene.traverse(child => {
                if (child.isMesh) {
                    child.material = new MeshPhongMaterial({
                        map: texture,
                        alphaMap,
                        normalMap,
                        alphaTest: 0.5,
                        transparent: true,
                        side: 2 // THREE.DoubleSide
                    });
                }
            });
            position.x = modelPosition.x;
            position.y = modelPosition.y;
            position.z = modelPosition.z;
            scale.x = scale.y = scale.z = modelScale;
            rotation.x = Math.PI / 2;
            rotation.y = -1.95;
            me.scene.add(scene);
        });

        me.light.intensity = 1.8;
        me.ambientLight.intensity = .9;
    }

    setLightColor(color) {
        const me = this;

        me.light.color = color;
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

        const repeat = () => {
            const now = me._clock.getTime();

            if (Math.floor(now / 1000) !== Math.floor(me._lastRefresh / 1000)) {
                me._refresh();
                me._lastRefresh = now;
            }
            if (me._container) {
                requestAnimationFrame(repeat);
            }
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

class OlympicsPlugin extends Plugin {

    constructor(options) {
        super(options);

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
        me._layer = new OlympicsLayer(me.id);
        me.markers = {};
        me._clickEventListener = () => {
            me._updatePanel();
        };
        me._viewModeEventListener = e => {
            me._onViewModeChanged(e.mode);
        };
    }

    onAdd(map) {
        const me = this,
            {map: mbox, lang, clock} = map;

        mbox.addLayer(me._layer, 'poi');
        mbox.setLayerZoomRange(me.id, 14, 24);

        me._olympicsCtrl = new OlympicsControl({lang, clock});
    }

    onRemove(map) {
        map.map.removeLayer(this._layer);
    }

    onEnabled() {
        const me = this,
            map = me._map;

        map.on('click', me._clickEventListener);
        map.on('viewmode', me._viewModeEventListener);
        me._addMarkers(olympics);
        me.setVisibility(true);
        map.map.addControl(me._olympicsCtrl);

        const repeat = () => {
            const now = map.clock.getTime();

            if (Math.floor(now / REFRESH_INTERVAL) !== Math.floor(me.lastRefresh / REFRESH_INTERVAL)) {
                me._layer.setLightColor(map.getLightColor());
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
            map = me._map;

        me._updatePanel();
        for (const id of Object.keys(me.markers)) {
            me.markers[id].remove();
            delete me.markers[id];
        }

        map.off('viewmode', me._viewModeEventListener);
        map.off('click', me._clickEventListener);
        me.setVisibility(false);
        map.map.removeControl(me._olympicsCtrl);
    }

    setVisibility(visible) {
        const me = this;

        me._updatePanel();
        for (const id of Object.keys(me.markers)) {
            me.markers[id].setVisibility(visible);
        }
        me._map.map.setLayoutProperty(me.id, 'visibility', visible ? 'visible' : 'none');
    }

    _onViewModeChanged(mode) {
        const me = this,
            opacities = mode === 'underground' ? [1, .1] : [.1, 1],
            start = performance.now();

        const repeat = () => {
            const elapsed = Math.min(performance.now() - start, TRANSITION_DURATION),
                opacity = opacities[0] + elapsed / TRANSITION_DURATION * (opacities[1] - opacities[0]);

            me._layer.setOpacity(opacity);

            if (elapsed < TRANSITION_DURATION) {
                requestAnimationFrame(repeat);
            }
        };

        repeat();
    }

    _addMarkers(venues) {
        const me = this,
            map = me._map,
            {lang} = map;

        for (const venue of venues) {
            const {center, zoom, bearing, pitch, id, name, sports, thumbnail} = venue,
                element = document.createElement('div');
            let popup;

            element.className = `olympics-marker ${sports[0].icon}-icon`;

            me.markers[id] = new Marker({element})
                .setLngLat(center)
                .addTo(map)
                .on('click', () => {
                    me._updatePanel(venue);
                    map.setViewMode('ground');
                    map.flyTo({center, zoom, bearing, pitch});
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

    _updatePanel(venue) {
        const me = this,
            {id} = venue || {};

        if (me.selectedVenue !== id && me.panel) {
            me.markers[me.selectedVenue].setActivity(false);
            me.panel.remove();
            delete me.panel;
            delete me.selectedVenue;
        }
        if (!me.selectedVenue && venue) {
            me.markers[id].setActivity(true);
            me.panel = new OlympicsPanel({venue}).addTo(me._map);
            me.selectedVenue = id;
        }
    }

}

export default function(options) {
    return new OlympicsPlugin(options);
}
