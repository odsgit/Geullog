import { forwardRef, type TextareaHTMLAttributes } from 'react'

interface TextAreaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string
  error?: string
}

export const TextArea = forwardRef<HTMLTextAreaElement, TextAreaProps>(
  ({ label, error, id, ...props }, ref) => {
    const textareaId = id ?? props.name

    return (
      <div className="flex flex-col gap-1.5">
        <label htmlFor={textareaId} className="text-sm font-semibold text-ink/80">
          {label}
        </label>
        <textarea
          id={textareaId}
          ref={ref}
          rows={4}
          className={`input resize-y ${error ? 'border-red-400' : ''}`}
          {...props}
        />
        {error && <p className="text-sm text-red-600">{error}</p>}
      </div>
    )
  },
)

TextArea.displayName = 'TextArea'
