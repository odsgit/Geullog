import { forwardRef, type InputHTMLAttributes } from 'react'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string
  error?: string
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, id, ...props }, ref) => {
    const inputId = id ?? props.name

    return (
      <div className="flex flex-col gap-1.5">
        <label htmlFor={inputId} className="text-sm font-bold text-black">
          {label}
        </label>
        <input
          id={inputId}
          ref={ref}
          className={`brutal-input ${error ? 'border-red-500' : ''}`}
          {...props}
        />
        {error && <p className="text-sm font-bold text-red-500">{error}</p>}
      </div>
    )
  },
)

Input.displayName = 'Input'
