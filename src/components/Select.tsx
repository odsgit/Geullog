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
        <label htmlFor={selectId} className="text-sm font-bold text-black">
          {label}
        </label>
        <select
          id={selectId}
          ref={ref}
          className={`brutal-input ${error ? 'border-red-500' : ''}`}
          {...props}
        >
          <option value="">선택해주세요</option>
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        {error && <p className="text-sm font-bold text-red-500">{error}</p>}
      </div>
    )
  },
)

Select.displayName = 'Select'
