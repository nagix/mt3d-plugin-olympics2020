# Tokyo 2020 Olympics plugin for Mini Tokyo 3D

Tokyo 2020 Olympics plugin shows olympic game venues and the event schedule in the [Mini Tokyo 3D](https://minitokyo3d.com) map.

## How to Use

First, load the Mini Tokyo 3D and this plugin within the `<head>` element of the HTML file.

```html
<script src="path/to/mini-tokyo-3d/dist/mini-tokyo-3d.min.js"></script>
<script src="path/to/mt3d-plugin-olympics2020/dist/mt3d-plugin-olympics2020.min.js"></script>
```

Then, create a MiniTokyo3D instance specifying the `plugins` propery, which is the array containing the plugin instance returned by `mt3dOlympics2020()`.

```html
<div id="map" style="width: 400px; height: 400px;"></div>
<script>
    const map = new mt3d.MiniTokyo3D({
        container: 'map',
        plugins: [mt3dOlympics2020()]
    });
</script>
```

## How to Build

The latest version of Node.js is required. Move to the root directory of the plugin, run the following commands, then the plugin scripts will be generated in the `build` directory.
```bash
npm install
npm run build
```

## License

Tokyo 2020 Olympics plugin for Mini Tokyo 3D is available under the [MIT license](https://opensource.org/licenses/MIT).
