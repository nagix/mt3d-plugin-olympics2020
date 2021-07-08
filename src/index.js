import {Marker, Panel, Plugin, Popup} from 'mini-tokyo-3d';
import SVG from './svg/index';
import olympics from './olympics.json';

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
    .olympics-icon {
        display: inline-block;
        width: 32px;
        height: 32px;
        margin-right: 6px;
        background: no-repeat center/32px;
        vertical-align: middle;
    }
    .olympics-marker {
        width: 40px;
        height: 40px;
        border: 2px solid #B11D33;
        border-radius: 50%;
        background: white no-repeat center/34px;
        cursor: pointer;
    }
    .olympics-marker-active {
        border-color: #33B5E5;
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
        `.${key}-icon {background-image: url("${addColor(SVG[key], 'white')}");}`,
        `.olympics-marker.${key}-icon {background-image: url("${addColor(SVG[key], '#B11D33')}");}`,
        `.olympics-marker-active.${key}-icon {background-image: url("${addColor(SVG[key], '#33B5E5')}");}`
    ].join('\n'))
].join('\n');
document.head.appendChild(style);

class OlympicsPanel extends Panel {

    constructor(options) {
        super(Object.assign({className: 'olympics-panel'}, options));
    }

    addTo(mt3d) {
        const me = this,
            {name, sports} = me._options.venue;

        me.setTitle(name[mt3d.lang])
            .setHTML((sports || []).map(sport => [
                '<div style="line-height: 32px;">',
                `<div class="olympics-icon ${sport.icon}-icon"></div>`,
                `<div style="display: inline-block; vertical-align: middle;">${sport.name[mt3d.lang] || sport.name.en}</div>`,
                '</div>',
                '<div>',
                (sport.schedule || []).map(item => [
                    '<div>',
                    `${item.date} ${item.start} - ${item.end}`,
                    '</div>',
                    '<ul>',
                    (item.events || []).map(event => [
                        '<li>',
                        event[mt3d.lang] || event.en,
                        '</li>'
                    ].join('')).join(''),
                    '</ul>',
                ].join('')).join(''),
                '</div>'
            ].join('')).join(''));
        return super.addTo(mt3d);
    }

}

function updateMarkerElement(element, highlight) {
    const {classList} = element;

    if (highlight) {
        classList.add('olympics-marker-active');
    } else {
        classList.remove('olympics-marker-active');
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
        me.markers = [];
        me._clickEventListener = () => {
            me._updatePanel();
        };
        me._clockModeEventListener = () => {
            me.setVisibility(true);
        };
    }

    onEnabled() {
        const me = this,
            mt3d = me._mt3d;

        mt3d.on('click', me._clickEventListener);
        mt3d.on('clockmode', me._clockModeEventListener);
        me._addMarkers(olympics);
        me.setVisibility(true);
    }

    onDisabled() {
        const me = this,
            mt3d = me._mt3d;

        me._updatePanel();
        for (const marker of me.markers) {
            marker.remove();
        }
        me.markers = [];

        mt3d.off('clockmode', me._clockModeEventListener);
        mt3d.off('click', me._clickEventListener);
    }

    setVisibility(visible) {
        const me = this;

        me._updatePanel();
        for (const marker of me.markers) {
            marker.getElement().style.visibility = visible ? 'visible' : 'hidden';
        }
    }

    _addMarkers(venues) {
        const me = this,
            mt3d = me._mt3d,
            {lang, map} = mt3d;

        for (const venue of venues) {
            const {center, zoom, bearing, pitch, id, name, sports, thumbnail} = venue,
                element = document.createElement('div');
            let popup;

            element.id = `venue-${id}`;
            element.className = `olympics-marker ${sports[0].icon}-icon`;
            element.addEventListener('click', event => {
                me._updatePanel(venue);
                if (popup) {
                    popup.remove();
                    popup = undefined;
                }
                mt3d.trackObject();
                mt3d._setViewMode('ground');
                map.flyTo({
                    center,
                    zoom,
                    bearing,
                    pitch
                });

                event.stopPropagation();
            });
            element.addEventListener('mouseenter', () => {
                updateMarkerElement(element, true);
                popup = new Popup({
                    className: 'popup-object',
                    closeButton: false,
                    closeOnClick: false,
                    maxWidth: '300px',
                    offset: {
                        top: [0, 10],
                        bottom: [0, -30]
                    },
                    openingAnimation: {
                        duration: 300,
                        easing: 'easeOutBack'
                    }
                });
                popup.setLngLat(center)
                    .setHTML([
                        '<div class="thumbnail-image-container">',
                        '<div class="ball-pulse"><div></div><div></div><div></div></div>',
                        `<div class="thumbnail-image" style="background-image: url(\'${thumbnail}\');"></div>`,
                        '</div>',
                        `<div><strong>${name[lang]}</strong></div>`
                    ].join(''))
                    .addTo(map);
            });
            element.addEventListener('mouseleave', () => {
                updateMarkerElement(element, me.selectedVenue === id);
                if (popup) {
                    popup.remove();
                    popup = undefined;
                }
            });
            element.addEventListener('mousemove', event => {
                mt3d.markObject();
                event.stopPropagation();
            });

            me.markers.push(
                new Marker(element)
                    .setLngLat(center)
                    .addTo(map)
            );
        }
    }

    _updatePanel(venue) {
        const me = this,
            mt3d = me._mt3d,
            {id} = venue || {};

        if (me.selectedVenue !== id && me.panel) {
            const element = mt3d.container.querySelector(`#venue-${me.selectedVenue}`);

            updateMarkerElement(element);
            me.panel.remove();
            delete me.panel;
            delete me.selectedVenue;
        }
        if (!me.selectedVenue && venue) {
            const element = mt3d.container.querySelector(`#venue-${id}`);

            updateMarkerElement(element, true);
            me.panel = new OlympicsPanel({venue}).addTo(mt3d);
            me.selectedVenue = id;
        }
    }

}

export default function(options) {
    return new OlympicsPlugin(options);
}
