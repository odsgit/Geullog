import type { ReactNode } from 'react'
import { motion, useReducedMotion, type Variants } from 'framer-motion'

interface RevealProps {
  children: ReactNode
  delay?: number
  className?: string
}

const variants: Variants = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0 },
}

// Shared scroll-in animation for landing sections. Skips motion entirely
// when the user prefers reduced motion, so content just appears in place.
export function Reveal({ children, delay = 0, className }: RevealProps) {
  const shouldReduceMotion = useReducedMotion()

  if (shouldReduceMotion) return <div className={className}>{children}</div>

  return (
    <motion.div
      className={className}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: '-80px' }}
      variants={variants}
      transition={{ duration: 0.5, delay, ease: 'easeOut' }}
    >
      {children}
    </motion.div>
  )
}
