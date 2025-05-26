import React, { useState } from 'react'

const HomeButton = ({text, action}) => {
  const [isHover, setHover] = useState(false);

  return (
    <button 
    name='create'
    className='border-2 border-amber-500 rounded-3xl w-xs p-4 cursor-pointer'
    style={{background: isHover ? "#f24ee5" : "#ffa74f",}}
    onMouseEnter={() => setHover(true)}
    onMouseLeave={() => setHover(false)}
    onClick={action}>
      {text}
    </button>
  )
}

export default HomeButton