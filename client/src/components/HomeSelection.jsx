import React, { useState } from 'react'
import HomeButton from './HomeButton'
import { createRoom } from '../api/createRoom';
import 'react-toastify/dist/ReactToastify.css';
import {toast, ToastContainer} from 'react-toastify'
import CreateRoomPopup from './CreateRoomPopup';
import { useNavigate } from 'react-router-dom';
import { joinRoom } from '../api/joinRoom';

const HomeSelection = () => {
  const[showCreateRoomPopup, setShowCreateRoomPopup] = useState(false);
  const[inputCode, setInputCode] = useState('');
  
  const handleCreateRoomClick = (e) => {
    setShowCreateRoomPopup(true);
  }
  const handleCreateRoomClose = (e) => {
    setShowCreateRoomPopup(false);
  }

  const navigate = useNavigate();

  const handleCreateRoom = async ({ username, password, maxUsers, isPrivate }) => {
    try {
      const data = await createRoom({ username, password, maxUsers, isPrivate });
      toast.success("Room Created!");
      setShowCreateRoomPopup(false);
      navigate(`/room/${data.roomCode}`);

    } catch (err) {
      console.error(err);
      toast.error(err.message || "Failed to create room.");
    }
  };

  const handleJoinRoom = async ({code}) => {
    if (!inputCode) {
      toast.error("Invalid Code");
      return;
    }
    try {
      const data = await joinRoom({code});
      toast.success("Room Joined!")
      navigate(`/room/${data.roomCode}`);
    } catch (err) {
      console.error(err);
      toast.error(err.message || "Failed to join room.")
    }
  };

  return (
    <>
    <div className='flex justify-center items-center h-screen'>
      <div className='flex flex-col justify-center items-center space-y-4'>
        <input 
        placeholder='Enter Room Code To Join' 
        className='border-2 border-amber-500 bg-white p-4 w-xs rounded-3xl 
        placeholder:text-sm text-1xl focus:border-blue-500 focus:outline-none text-center'
        onChange={e => setInputCode(e.target.value)}>
        </input>
        <HomeButton text="Join Room Code" action={() => handleJoinRoom({code: inputCode})}/>
        <HomeButton text="Create a Room" action={handleCreateRoomClick}></HomeButton>
        <HomeButton text="Browse Rooms"></HomeButton>
      </div>
      <div className='fixed flex justify-center items-center'>
        {showCreateRoomPopup && <CreateRoomPopup onClose={handleCreateRoomClose} onCreate={handleCreateRoom}></CreateRoomPopup>}
      </div>
    </div>
    <ToastContainer className='fixed top-2'></ToastContainer>
    </>
  )
}

export default HomeSelection