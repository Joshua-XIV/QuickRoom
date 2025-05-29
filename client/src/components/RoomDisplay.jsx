import {Resizable} from 're-resizable'
import ChatDisplay from './ChatDisplay'
import GridDisplay from './GridDisplay'
import { useState } from 'react'

const RoomDisplay = ({code, socket, username}) => {
  const [videoEnabled, setVideoEnabled] = useState(false);
  const [audioEnabled, setAudioEnabled] = useState(true);

  const toggleVideo = () => setVideoEnabled(prev => !prev);
  const toggleAudio = () => setAudioEnabled(prev => !prev);

  return (
    <div className='flex'>
      <div className='fixed p-2 z-10 bottom-2 left-1/2 bg-amber-500 gap-2 space-x-4'>
        <button onClick={toggleVideo} className='px-4 py-2 bg-black text-white rounded-xl'>
          {videoEnabled ? "Turn Off Camera" : "Turn On Camera"}
        </button>
        <button onClick={toggleAudio} className='px-4 py-2 bg-black text-white rounded-xl'>
          {audioEnabled ? "Mute Mic" : "Unmute Mic"}
        </button>
      </div>
      <Resizable
      defaultSize={{width:'25vw', height:'100vh'}}
      minHeight='100vh'
      minWidth='15vw'
      maxWidth='30%'
      enable={{right: true}}
      className='bg-amber-500 border-2'>
        <ChatDisplay socket={socket} username={username} code={code}/>
      </Resizable>
      <GridDisplay socket={socket} code={code} username={username} videoEnabled={videoEnabled} audioEnabled={audioEnabled}/>
    </div>
  )
}

export default RoomDisplay