import {Resizable} from 're-resizable'
import ChatDisplay from './ChatDisplay'
import GridDisplay from './GridDisplay'

const SideDisplay = ({code, socket, username}) => {
  return (
    <div className='flex'>
      <Resizable
      defaultSize={{width:'25vw', height:'100vh'}}
      minHeight='100vh'
      minWidth='15vw'
      maxWidth='30%'
      enable={{right: true}}
      className='bg-amber-500 border-2'>
        <ChatDisplay socket={socket} username={username} code={code}/>
      </Resizable>
      <GridDisplay socket={socket} code={code}/>
    </div>
  )
}

export default SideDisplay