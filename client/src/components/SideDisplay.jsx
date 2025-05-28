import {Resizable} from 're-resizable'
import SelfDisplay from './SelfDisplay'
import ChatDisplay from './ChatDisplay'

const SideDisplay = ({code, socket, username}) => {
  return (
    <Resizable
    defaultSize={{width:'25vw', height:'100vh'}}
    minHeight='100vh'
    minWidth='15vw'
    maxWidth='30%'
    enable={{right: true}}
    className='bg-amber-500 border-2'>
      <ChatDisplay socket={socket} username={username} code={code}/>
    </Resizable>
  )
}

export default SideDisplay