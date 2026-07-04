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
        <label htmlFor={textareaId} className="text-sm font-bold text-black">
          {label}
        </label>
        <textarea
          id={textareaId}
          ref={ref}
          rows={4}
          className={`brutal-input resize-y ${error ? 'border-red-500' : ''}`}
          {...props}
        />
        {error && <p className="text-sm font-bold text-red-500">{error}</p>}
      </div>
    )
  },
)

TextArea.displayName = 'TextArea'
