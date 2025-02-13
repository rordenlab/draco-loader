import draco3d from 'draco3d'

/**
 * Parses a Draco-compressed buffer and extracts vertex positions and triangle indices.
 * @param {ArrayBuffer} buffer - The Draco-encoded mesh data.
 * @param {boolean} normalizeColors - Whether to normalize colors from 0-255 to 0-1.
 * @returns {Promise<{ positions: Float32Array, indices: Uint32Array, colors: Uint8Array | null }>}
 */
export async function parseDraco(buffer, normalizeColors = true) {
  try {
    const draco = await draco3d.createDecoderModule() // Load the Draco decoder
    const decoder = new draco.Decoder()
    const byteArray = new Int8Array(buffer)
    const bufferDraco = new draco.DecoderBuffer()
    bufferDraco.Init(byteArray, byteArray.length)

    const geometryType = decoder.GetEncodedGeometryType(bufferDraco)
    if (geometryType !== draco.TRIANGULAR_MESH) {
      throw new Error('Unsupported Draco geometry type.')
    }

    const mesh = new draco.Mesh()
    const status = decoder.DecodeBufferToMesh(bufferDraco, mesh)
    if (!status.ok() || mesh.ptr === 0) {
      throw new Error('Failed to decode Draco mesh.')
    }

    // Extract positions
    const numPoints = mesh.num_points()
    const numFaces = mesh.num_faces()
    if (numPoints === 0 || numFaces === 0) {
      throw new Error('Decoded mesh has no valid geometry.')
    }

    const posAttribute = decoder.GetAttributeByUniqueId(mesh, draco.POSITION)
    if (!posAttribute) {
      throw new Error('Draco POSITION attribute not found.')
    }
    // Allocate the Float32Array correctly
    const positions = new Float32Array(numPoints * 3)
    // Use DracoFloat32Array to safely extract data
    const dracoArray = new draco.DracoFloat32Array()
    decoder.GetAttributeFloatForAllPoints(mesh, posAttribute, dracoArray)
    for (let i = 0; i < numPoints * 3; i++) {
      positions[i] = dracoArray.GetValue(i)
    }
    // Free the memory allocated by Draco
    draco.destroy(dracoArray)
    // Extract indices safely
    const indices = new Uint32Array(numFaces * 3)
    const face = new draco.DracoInt32Array()
    for (let i = 0; i < numFaces; i++) {
      decoder.GetFaceFromMesh(mesh, i, face)
      indices.set([face.GetValue(0), face.GetValue(1), face.GetValue(2)], i * 3)
    }
    draco.destroy(face) // Free face index array

    // Extract colors (if available)
    let colors = null
    const colorAttribute = decoder.GetAttributeByUniqueId(mesh, draco.COLOR)
    if (colorAttribute) {
      const numColorComponents = colorAttribute.num_components()
      if (numColorComponents === 3 || numColorComponents === 4) {
        colors = new Uint8Array(numPoints * 4)
        const tempColors = new Uint8Array(numPoints * numColorComponents)
        decoder.GetAttributeUInt8ForAllPoints(mesh, colorAttribute, tempColors)

        // Convert RGB to RGBA (if needed)
        for (let i = 0; i < numPoints; i++) {
          colors[i * 4] = tempColors[i * numColorComponents] // R
          colors[i * 4 + 1] = tempColors[i * numColorComponents + 1] // G
          colors[i * 4 + 2] = tempColors[i * numColorComponents + 2] // B
          colors[i * 4 + 3] = numColorComponents === 4 ? tempColors[i * 4 + 3] : 255 // A
        }
      }
    }

    // Properly free allocated memory
    draco.destroy(mesh) // Clean up mesh object
    draco.destroy(bufferDraco) // Clean up Draco buffer
    draco.destroy(decoder) // Clean up decoder

    return { positions, indices, colors }
  } catch (error) {
    console.error('Draco parsing error:', error.message)
    throw error
  }
}
