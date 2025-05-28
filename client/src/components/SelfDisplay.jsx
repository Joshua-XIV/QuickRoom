import React, { useEffect, useRef } from 'react'

const SelfDisplay = () => {
  /*const videoRef = useRef(null);

  useEffect(() => {
    const startVideo = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: false,
          audio: false,
        });
        
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        } 
      } catch (err) {
        console.err(err)
      }
    };

    startVideo();
  }, []);*/

  return (
    <div className='bg-red-500 flex w-full items-center justify-center aspect-video'>
      <video autoPlay muted className='w-full h-full object-cover p-2'>

      </video>
    </div>
  )
}

export default SelfDisplay