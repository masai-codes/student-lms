type LevelUpIconProps = {
  className?: string
  width?: number
  height?: number
  color?: string
}

const DEFAULT_FILL = '#4B5563'

/** Matches legacy student app `LevelUpIcon` (profile menu). */
export function LevelUpIcon({
  className = '',
  width = 23,
  height = 18,
  color = DEFAULT_FILL,
}: LevelUpIconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={width}
      height={height}
      viewBox="0 0 23 18"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      <path d="M4.81569 12.6935H8.99622V15.5076H1.07422V2.28168H4.81569V12.6935Z" fill={color} />
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M22.0663 2.26514C22.0663 2.26514 22.2165 11.241 22.0663 11.8296C21.9155 12.4195 20.718 15.5072 16.5273 15.5073C12.3361 15.5073 11.1369 12.4191 10.9872 11.8296C10.838 11.2413 10.9871 2.27198 10.9872 2.26514H15.8329L13.1728 5.31104C13.0838 5.42344 13.0585 5.56133 13.1093 5.69873C13.1728 5.82357 13.2997 5.91052 13.4394 5.91064H15.0409V11.3198C15.041 11.5197 15.2068 11.6821 15.4101 11.6821H17.6855C17.8886 11.6819 18.0536 11.5194 18.0536 11.3198V5.88623H19.6552C19.795 5.88616 19.9218 5.79815 19.9853 5.67334C20.0106 5.62351 20.0234 5.57376 20.0234 5.52393C20.0234 5.43645 19.9981 5.36156 19.9345 5.28662L17.2558 2.26514H22.0663Z"
        fill={color}
      />
    </svg>
  )
}
