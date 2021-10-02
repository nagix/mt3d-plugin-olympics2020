# Tokyo 2020 Olympics plugin for Mini Tokyo 3D

Tokyo 2020 Olympics plugin shows the Olympic competition venues and the event schedule in the [Mini Tokyo 3D](https://minitokyo3d.com) map.

![Screenshot](https://nagix.github.io/mt3d-plugin-olympics2020/screenshot1.jpg)

## How to Use

First, load the Mini Tokyo 3D and this plugin within the `<head>` element of the HTML file.

```html
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/mini-tokyo-3d@next/dist/mini-tokyo-3d.min.css" />
<script src="https://cdn.jsdelivr.net/npm/mini-tokyo-3d@next/dist/mini-tokyo-3d.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/mt3d-plugin-olympics2020@latest/dist/mt3d-plugin-olympics2020.min.js"></script>
```

Then, create a MiniTokyo3D instance specifying the `plugins` property, which is the array containing the plugin instance returned by `mt3dOlympics2020()`.

```html
<div id="map" style="width: 400px; height: 400px;"></div>
<script>
    const map = new mt3d.MiniTokyo3D({
        container: 'map',
        plugins: [mt3dOlympics2020()]
    });
</script>
```

## About Data

The 3D model of the Olympic Stadium used in this plugin is sourced from [ARCHITECTURE GRAVURE](https://christinayan01.jp/architecture/archives/14112#).

_Copyright (c) 2021 christinayan by Takahiro Yanai<br>Released under the MIT license_


## How to Build

The latest version of Node.js is required. Move to the root directory of the plugin, run the following commands, then the plugin scripts will be generated in the `dist`. The files in the `data` directory need to be uploaded to the place specified by `DATA_URL` in the source code.
```bash
npm install
npm run build
```

## License

Tokyo 2020 Olympics plugin for Mini Tokyo 3D is available under the [MIT license](https://opensource.org/licenses/MIT).
