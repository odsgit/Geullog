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
        <label htmlFor={textareaId} className="text-sm font-medium text-gray-700">
          {label}
        </label>
        <textarea
          id={textareaId}
          ref={ref}
          rows={4}
          className={`resize-y rounded-lg border bg-white px-3 py-2.5 text-sm text-gray-900 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-900/10 ${
            error ? 'border-red-400' : 'border-gray-200 focus:border-gray-400'
          }`}
          {...props}
        />
        {error && <p className="text-sm text-red-500">{error}</p>}
      </div>
    )
  },
)

TextArea.displayName = 'TextArea'
