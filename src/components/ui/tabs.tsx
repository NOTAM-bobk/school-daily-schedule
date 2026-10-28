import * as React from 'react'

interface TabsContextValue {
  value: string
  onValueChange: (value: string) => void
  shape?: 'default' | 'pill'
}

const TabsContext = React.createContext<TabsContextValue | null>(null)

export interface TabsProps extends React.HTMLAttributes<HTMLDivElement> {
  value?: string
  defaultValue?: string
  onValueChange?: (value: string) => void
}

export function Tabs({
  value: controlledValue,
  defaultValue = '',
  onValueChange,
  className = '',
  children,
  ...props
}: TabsProps) {
  const [uncontrolledValue, setUncontrolledValue] = React.useState(defaultValue)
  const isControlled = controlledValue !== undefined
  const value = isControlled ? controlledValue : uncontrolledValue

  const handleValueChange = React.useCallback(
    (newValue: string) => {
      if (!isControlled) {
        setUncontrolledValue(newValue)
      }
      onValueChange?.(newValue)
    },
    [isControlled, onValueChange]
  )

  return (
    <TabsContext.Provider value={{ value, onValueChange: handleValueChange }}>
      <div className={`tabs-root ${className}`.trim()} {...props}>
        {children}
      </div>
    </TabsContext.Provider>
  )
}

export interface TabsListProps extends React.HTMLAttributes<HTMLDivElement> {
  shape?: 'default' | 'pill'
}

export function TabsList({
  shape = 'default',
  className = '',
  children,
  ...props
}: TabsListProps) {
  const context = React.useContext(TabsContext)
  if (!context) throw new Error('TabsList must be used within Tabs')

  return (
    <div
      role="tablist"
      data-shape={shape}
      className={`tabs-list tabs-list--${shape} ${className}`.trim()}
      {...props}
    >
      {children}
    </div>
  )
}

export interface TabsTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  value: string
}

export function TabsTrigger({
  value,
  className = '',
  children,
  disabled,
  onClick,
  ...props
}: TabsTriggerProps) {
  const context = React.useContext(TabsContext)
  if (!context) throw new Error('TabsTrigger must be used within Tabs')

  const isSelected = context.value === value

  return (
    <button
      type="button"
      role="tab"
      aria-selected={isSelected}
      data-state={isSelected ? 'active' : 'inactive'}
      tabIndex={isSelected ? 0 : -1}
      disabled={disabled}
      className={`tabs-trigger ${isSelected ? 'is-active' : ''} ${className}`.trim()}
      onClick={(e) => {
        onClick?.(e)
        if (!disabled) {
          context.onValueChange(value)
        }
      }}
      {...props}
    >
      {children}
    </button>
  )
}

export interface TabsContentProps extends React.HTMLAttributes<HTMLDivElement> {
  value: string
}

export function TabsContent({
  value,
  className = '',
  children,
  ...props
}: TabsContentProps) {
  const context = React.useContext(TabsContext)
  if (!context) throw new Error('TabsContent must be used within Tabs')

  if (context.value !== value) return null

  return (
    <div
      role="tabpanel"
      data-state={context.value === value ? 'active' : 'inactive'}
      className={`tabs-content ${className}`.trim()}
      {...props}
    >
      {children}
    </div>
  )
}
