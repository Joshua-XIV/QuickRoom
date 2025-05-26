import React, { useEffect, useState } from 'react'
import HomeImage from '../assets/mountains.jpg'

const HomeBackGround = () => {
  const [isVisible, setVisible] = useState(false)

  useEffect(() => { 
    setTimeout(() => {
      setVisible(true)
    }, 100);
  }, []);

  return (
    <div className={`-z-10 fixed w-screen h-screen overflow-hidden transition-opacity duration-3000 ease-in-out ${isVisible ? "opacity-100" : "opacity-40"}`}>
      <img src={HomeImage}></img>
    </div>
  )
}

export default HomeBackGround