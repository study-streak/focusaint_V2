/*
  FILE: motionVariants (Global Animation Control)

  PURPOSE:
  - Central animation presets for entire dashboard
  - Keeps animations consistent + smooth

  NOTE:
  - Import in components instead of writing random animations
*/

export const fadeInUp = {
    hidden: { opacity: 0, y: 40 },
    visible: {
        opacity: 1,
        y: 0,
        transition: { duration: 0.6, ease: "easeOut" },
    },
}

export const scaleIn = {
    hidden: { scale: 0.8, opacity: 0 },
    visible: {
        scale: 1,
        opacity: 1,
        transition: { duration: 0.5 },
    },
}

export const staggerContainer = {
    hidden: {},
    visible: {
        transition: {
            staggerChildren: 0.15,
        },
    },
}

export const pulse = {
    animate: {
        scale: [1, 1.05, 1],
        transition: {
            repeat: Infinity,
            duration: 1.5,
        },
    },
}

export const glow = {
    animate: {
        opacity: [0.3, 0.7, 0.3],
        transition: {
            repeat: Infinity,
            duration: 2,
        },
    },
}