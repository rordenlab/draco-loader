## draco-loader

The draco-loader is a NiiVue plugin that converts [draco (.drc)](https://google.github.io/draco/) files into mz3 meshes. While draco enables compact, fast-transferring files, it remains uncommon in neuroimaging. Additionally, supporting draco introduces dependencies. Specifically, here we use the [draco3d](https://github.com/google/draco#readme) library installed as a [npm package](https://www.npmjs.com/package/draco3d). Be aware that draco optimizes mesh indices, and therefore converting a mesh from another format to draco will disrupt the ability to load vertex color overlays (statistical maps, thickness maps, curvature). Further, FreeSurfer meshes use a [hierarchical order](https://brainder.org/2016/05/31/downsampling-decimating-a-brain-surface/) that allows subdivision that will be impaired. While draco provides extreme compression, the deployment and features are not as mature as other formats, and this loader should be seen as experimental. A more popular way for using this compression method is in concert with the glTF .glb format - for more details see the [glb-loader](https://github.com/rordenlab/glb-loader).

## Local Development

To illustrate this library, `glb2mz3` is a node.js converter that can be run from the command line:

```bash
git clone git@github.com:rordenlab/draco-loader.git
cd draco-loader
npm install
node ./src/glb2mz3.js ./tests/testData/mesh.glb
```

## Local Browser Development

You can also embed this loader into a hot-reloadable NiiVue web page to evaluate integration:

```bash
git clone git@github.com:rordenlab/draco-loader.git
cd draco-loader
npm install
npm run dev
```

## Creating Draco Datasets

Draco is still an emerging format. You can convert meshes from other formats (.ply, .stl, .obj) to Draco using the `draco_encoder` command line tool. Note that the output meshes will be much smaller than the input meshes, reflecting the impressive compression abilities.

```bash
git clone https://github.com/google/draco.git
cd draco
mkdir build && cd build
cmake ..
cmake --build . --config Release
./draco_encoder -i input.stl -o output.drc
```