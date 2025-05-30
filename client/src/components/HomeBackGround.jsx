import React, { useEffect, useState } from 'react'
import HomeImage from '../assets/mountains.jpg'

const HomeBackGround = () => {
  const [isVisible, setVisible] = useState(false)

  useEffect(() => { 
    const timeout = setTimeout(() => {
      setVisible(true)
    }, 100);

    return () => clearTimeout(timeout);
  }, []);

  return (
    <div className={`-z-10 fixed w-full h-screen transition-opacity duration-2000 ease-in-out ${isVisible ? "opacity-100" : "opacity-40"}`}>
      <img src={HomeImage} className='object-cover w-full h-full'></img>
    </div>
  )
}

export default HomeBackGround