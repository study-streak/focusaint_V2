"use client"

/*
  COMPONENT: NoiseOverlay (Texture Layer)

  PURPOSE:
  - Adds subtle grain/noise texture
  - Removes “flat digital feel”
  - Makes UI feel more organic + premium

  BACKEND:
  - ❌ NONE

  STATIC:
  - Self-contained

  DESIGN RULE:
  - extremely subtle (almost invisible)
*/

export default function NoiseOverlay() {
    return (
        <div className="pointer-events-none fixed inset-0 z-50 opacity-[0.03] mix-blend-overlay">

            {/* SVG NOISE */}
            <svg
                className="w-full h-full"
                xmlns="http://www.w3.org/2000/svg"
            >
                <filter id="noiseFilter">
                    <feTurbulence
                        type="fractalNoise"
                        baseFrequency="0.9"
                        numOctaves="3"
                        stitchTiles="stitch"
                    />
                </filter>

                <rect
                    width="100%"
                    height="100%"
                    filter="url(#noiseFilter)"
                />
            </svg>

        </div>
    )
}