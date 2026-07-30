import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Canvas, useFrame, useLoader, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import useMediaQuery from '../hooks/useMediaQuery'

/** Geometry only — the exporter's baked text was stripped out, see scripts/strip-glb-texture.mjs. */
const MODEL_URL = '/models/text-cylinder.glb'

const TEXTURE_WIDTH = 2048
const INK = '#e7e5e4'
/** Opacity of the far wall, matching the model's `text_ink_reverse` material. */
const REVERSE_OPACITY = 0.16
const SPIN_SPEED = 0.13 // radians/second

interface PoemCylinderProps {
  text: string
  className?: string
}

/**
 * Paints the poem into a texture sized to the cylinder's own proportions, so
 * the type isn't stretched when it wraps: the canvas is as many times wider
 * than tall as the drum's circumference is longer than its height.
 */
function usePoemTexture(text: string, circumference: number, height: number) {
  const [texture, setTexture] = useState<THREE.CanvasTexture | null>(null)

  useEffect(() => {
    if (!circumference || !height) return
    let cancelled = false

    const paint = () => {
      if (cancelled) return
      const canvas = document.createElement('canvas')
      canvas.width = TEXTURE_WIDTH
      canvas.height = Math.round((TEXTURE_WIDTH * height) / circumference)
      const ctx = canvas.getContext('2d')
      if (!ctx) return

      const wrap = (size: number) => {
        ctx.font = `${size}px "Instrument Serif", serif`
        const lines: string[] = []
        let line = ''
        for (const word of text.split(' ')) {
          const candidate = line ? `${line} ${word}` : word
          if (ctx.measureText(candidate).width > canvas.width && line) {
            lines.push(line)
            line = word
          } else {
            line = candidate
          }
        }
        if (line) lines.push(line)
        return lines
      }

      // Take the largest type that still fits the drum's height, so the poem
      // fills the surface rather than floating in the middle of it.
      let fontSize = 96
      let lines = wrap(fontSize)
      while (fontSize > 16 && lines.length * fontSize * 1.42 > canvas.height) {
        fontSize -= 2
        lines = wrap(fontSize)
      }

      const lineHeight = canvas.height / lines.length
      ctx.font = `${fontSize}px "Instrument Serif", serif`
      ctx.fillStyle = INK
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      lines.forEach((l, i) => {
        ctx.fillText(l, canvas.width / 2, lineHeight * (i + 0.5))
      })

      // Erase back into the top and bottom edges so the first and last lines
      // dissolve rather than stopping at a hard rim.
      const fade = ctx.createLinearGradient(0, 0, 0, canvas.height)
      fade.addColorStop(0, 'rgba(0,0,0,1)')
      fade.addColorStop(0.16, 'rgba(0,0,0,0)')
      fade.addColorStop(0.84, 'rgba(0,0,0,0)')
      fade.addColorStop(1, 'rgba(0,0,0,1)')
      ctx.globalCompositeOperation = 'destination-out'
      ctx.fillStyle = fade
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      ctx.globalCompositeOperation = 'source-over'

      const tex = new THREE.CanvasTexture(canvas)
      tex.colorSpace = THREE.SRGBColorSpace
      tex.anisotropy = 8
      tex.wrapS = THREE.RepeatWrapping
      setTexture(tex)
    }

    // Painting before the webfont resolves would bake the fallback face in.
    if (document.fonts?.ready) document.fonts.ready.then(paint)
    else paint()

    return () => {
      cancelled = true
    }
  }, [text, circumference, height])

  useEffect(() => () => texture?.dispose(), [texture])

  return texture
}

function Drum({ text, spin }: { text: string; spin: boolean }) {
  const gltf = useLoader(GLTFLoader, MODEL_URL)
  const group = useRef<THREE.Group>(null)

  // One geometry serves both walls; the model draws it twice (text_face_far and
  // text_face_near) with different materials. Centre it so orbiting stays put.
  const geometry = useMemo(() => {
    let found: THREE.BufferGeometry | null = null
    gltf.scene.traverse((obj) => {
      if (!found && (obj as THREE.Mesh).isMesh) found = (obj as THREE.Mesh).geometry as THREE.BufferGeometry
    })
    if (!found) return null
    const geo = (found as THREE.BufferGeometry).clone()
    geo.computeBoundingBox()
    const centre = new THREE.Vector3()
    geo.boundingBox?.getCenter(centre)
    geo.translate(-centre.x, -centre.y, -centre.z)
    return geo
  }, [gltf])

  const dims = useMemo(() => {
    if (!geometry) return { circumference: 0, height: 0 }
    geometry.computeBoundingBox()
    const size = new THREE.Vector3()
    geometry.boundingBox?.getSize(size)
    return { circumference: Math.PI * size.x, height: size.y }
  }, [geometry])

  const texture = usePoemTexture(text, dims.circumference, dims.height)

  useFrame((_, delta) => {
    if (spin && group.current) group.current.rotation.y += SPIN_SPEED * delta
  })

  if (!geometry || !texture) return null

  return (
    <group ref={group}>
      {/* Far wall first: seen through the near one, faint and reversed. */}
      <mesh geometry={geometry} renderOrder={0}>
        <meshBasicMaterial
          map={texture}
          transparent
          opacity={REVERSE_OPACITY}
          side={THREE.BackSide}
          depthWrite={false}
        />
      </mesh>
      <mesh geometry={geometry} renderOrder={1}>
        <meshBasicMaterial
          map={texture}
          transparent
          opacity={1}
          side={THREE.FrontSide}
          depthWrite={false}
        />
      </mesh>
    </group>
  )
}

/** Built imperatively so the scene doesn't need JSX typings for the controls. */
function Orbit({ onGrab }: { onGrab: () => void }) {
  const camera = useThree((s) => s.camera)
  const domElement = useThree((s) => s.gl.domElement)
  const controls = useRef<OrbitControls | null>(null)

  useEffect(() => {
    const c = new OrbitControls(camera, domElement)
    c.enablePan = false
    c.enableDamping = true
    c.dampingFactor = 0.075
    c.rotateSpeed = 0.6
    c.zoomSpeed = 0.6
    c.minDistance = 3.4
    c.maxDistance = 11
    // Keep the drum upright — a full flip reads as a mistake, not a feature.
    c.minPolarAngle = Math.PI * 0.22
    c.maxPolarAngle = Math.PI * 0.78
    c.addEventListener('start', onGrab)
    controls.current = c
    return () => {
      c.removeEventListener('start', onGrab)
      c.dispose()
    }
  }, [camera, domElement, onGrab])

  useFrame(() => controls.current?.update())
  return null
}

/** Shown where WebGL isn't available, so the verse still reads. */
function PoemFallback({ text }: { text: string }) {
  return (
    <p className="font-serif flex h-full items-center text-center text-lg leading-relaxed text-neutral-400">
      {text}
    </p>
  )
}

export default function PoemCylinder({ text, className = '' }: PoemCylinderProps) {
  const compact = useMediaQuery('(max-width: 767px)')
  const reduceMotion = useMediaQuery('(prefers-reduced-motion: reduce)')
  const [touched, setTouched] = useState(false)
  const onGrab = useCallback(() => setTouched(true), [])

  const size = compact ? { width: 224, height: 300 } : { width: 320, height: 400 }

  return (
    <div className={className}>
      <div
        aria-hidden
        className="mx-auto cursor-grab active:cursor-grabbing"
        style={size}
      >
        <Canvas
          dpr={[1, 2]}
          gl={{ alpha: true, antialias: true }}
          camera={{ position: [0, 0, 6.2], fov: 34 }}
          fallback={<PoemFallback text={text} />}
        >
          <Drum text={text} spin={!touched && !reduceMotion} />
          <Orbit onGrab={onGrab} />
        </Canvas>
      </div>
      {/* The drum is decorative; the poem itself is read out as prose. */}
      <p className="sr-only">{text}</p>
    </div>
  )
}
