export function BigButton({ children, variant = 'primary', ...props }) {
  return (
    <button className={`big-button big-button--${variant}`} {...props}>
      {children}
    </button>
  )
}
