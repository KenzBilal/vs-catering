import { Switch } from '@headlessui/react'

export default function Toggle({ checked, onChange, label, description }) {
  return (
    <Switch.Group as="div" className="flex items-center justify-between w-full">
      <span className="flex flex-grow flex-col pr-4">
        <Switch.Label as="span" className="text-[15px] font-medium text-stone-800" passive>
          {label}
        </Switch.Label>
        {description && (
          <Switch.Description as="span" className="text-[13px] text-stone-500 mt-1">
            {description}
          </Switch.Description>
        )}
      </span>
      <Switch
        checked={checked}
        onChange={onChange}
        className={`${
          checked ? 'bg-stone-800' : 'bg-cream-300'
        } relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-stone-800 focus:ring-offset-2 focus:ring-offset-cream-50`}
      >
        <span
          aria-hidden="true"
          className={`${
            checked ? 'translate-x-5' : 'translate-x-0'
          } pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out`}
        />
      </Switch>
    </Switch.Group>
  )
}
