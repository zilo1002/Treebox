// 3D 模型压缩：Draco 压 GLB/GLTF 的网格几何（浏览器内完成，不上传）。
// 只压几何：骨骼、蒙皮、动画原样保留；贴图和动画数据不压。
// 有损：顶点位置按精度量化（肉眼基本看不出来），不是逐字节相同。
// 输出仍是 .glb（带 KHR_draco_mesh_compression），对方要支持 Draco 才读得了。
// 注意：Draco 编码在 writeBinary 里才真正发生；transform 只设选项。
import { WebIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import { draco } from '@gltf-transform/functions';
import draco3d from 'draco3dgltf';
import encoderWasmUrl from 'draco3dgltf/draco_encoder.wasm?url';

let encoderPromise = null;
function getEncoderModule() {
  if (!encoderPromise) {
    encoderPromise = (async () => {
      const wasmBinary = await (await fetch(encoderWasmUrl)).arrayBuffer();
      return draco3d.createEncoderModule({ wasmBinary });
    })();
  }
  return encoderPromise;
}

// 精度 1–9 → 位置量化位数：1→10，6→13，9→14。通用属性（关节/权重）固定 12 位，保蒙皮。
export function levelToBits(level) {
  const pos = 10 + Math.round((level - 1) / 2);
  return {
    quantizePosition: pos,
    quantizeNormal: Math.max(6, pos - 4),
    quantizeTexcoord: Math.max(8, pos - 2),
    quantizeColor: 8,
    quantizeGeneric: 12,
  };
}

function parseGlbJson(bytes) {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  if (String.fromCharCode(...bytes.subarray(0, 4)) !== 'glTF') throw new Error('NOT_GLB');
  const jsonLen = view.getUint32(12, true);
  return JSON.parse(new TextDecoder().decode(bytes.subarray(20, 20 + jsonLen)));
}

export async function compressGlb(arrayBuffer, fileName, { level = 6, onStage = () => {} } = {}) {
  const isGltf = /\.gltf$/i.test(fileName || '');
  const bytes = new Uint8Array(arrayBuffer);
  const io = new WebIO()
    .registerExtensions(ALL_EXTENSIONS)
    .registerDependencies({ 'draco3d.encoder': await getEncoderModule() });

  let doc;
  if (isGltf) {
    // .gltf 只接受自包含的（buffer/image 都是 data: 内嵌）；依赖外部文件直接明说。
    const json = JSON.parse(new TextDecoder().decode(bytes));
    const external = [
      ...(json.buffers || []).map(b => b.uri),
      ...(json.images || []).map(i => i.uri),
    ].some(uri => uri && !uri.startsWith('data:'));
    if (external) throw new Error('GLTF_EXTERNAL');
    onStage('read');
    doc = await io.readJSON({ json, resources: {} });
  } else {
    const json = parseGlbJson(bytes);
    if ((json.extensionsUsed || []).includes('KHR_draco_mesh_compression')) {
      throw new Error('ALREADY_DRACO');
    }
    onStage('read');
    doc = await io.readBinary(bytes);
  }

  // 无索引的网格 Draco 编不了，先明说，不静默跳过。
  for (const mesh of doc.getRoot().listMeshes()) {
    for (const prim of mesh.listPrimitives()) {
      if (!prim.getIndices()) throw new Error('NO_INDICES');
    }
  }

  onStage('encode');
  await doc.transform(draco({
    method: 'edgebreaker',
    encodeSpeed: 5,
    decodeSpeed: 5,
    ...levelToBits(level),
  }));
  onStage('write');
  return io.writeBinary(doc); // Uint8Array (.glb)
}
