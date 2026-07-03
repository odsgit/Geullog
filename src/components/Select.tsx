import { forwardRef, type SelectHTMLAttributes } from 'react'

interface SelectOption {
  value: string
  label: string
}

interface SelectProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'children'> {
  label: string
  options: SelectOption[]
  error?: string
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, options, error, id, ...props }, ref) => {
    const selectId = id ?? props.name

    return (
      <div className="flex flex-col gap-1.5">
        <label htmlFor={selectId} className="text-sm font-medium text-gray-700">
          {label}
        </label>
        <select
          id={selectId}
          ref={ref}
          className={`rounded-lg border bg-white px-3 py-2.5 text-sm text-gray-900 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-900/10 ${
            error ? 'border-red-400' : 'border-gray-200 focus:border-gray-400'
          }`}
          {...props}
        >
          <option value="">선택해주세요</option>
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        {error && <p className="text-sm text-red-500">{error}</p>}
      </div>
    )
  },
)

Select.displayName = 'Select'
