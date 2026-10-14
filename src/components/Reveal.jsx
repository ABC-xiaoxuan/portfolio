import { useInView } from '../hooks/useReveal.js'

/**
 * Scroll-reveal wrapper. Only animates opacity + transform, and the CSS
 * honours prefers-reduced-motion.
 */
export default function Reveal({ as: Tag = 'div', delay = 0, className = '', children, ...rest }) {
  const [ref, inView] = useInView()

  return (
    <Tag
      ref={ref}
      className={['reveal', inView ? 'is-in' : '', className].filter(Boolean).join(' ')}
      style={{ '--reveal-delay': `${delay}ms` }}
      {...rest}
    >
      {children}
    </Tag>
  )
}
