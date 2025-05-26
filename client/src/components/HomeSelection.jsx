import React, { useState } from 'react'
import HomeButton from './HomeButton'
import { createRoom } from '../api/createRoom';
import 'react-toastify/dist/ReactToastify.css';
import {toast, ToastContainer} from 'react-toastify'
import CreateRoomPopup from './CreateRoomPopup';

const HomeSelection = () => {
  const[showCreateRoomPopup, setShowCreateRoomPopup] = useState(false);
  
  const handleCreateRoomClick = (e) => {
    setShowCreateRoomPopup(true)
  }
  const handleCreateRoomClose = (e) => {
    setShowCreateRoomPopup(false)
  }

  const handleCreateRoom = async ({ username, password, maxUsers, isPrivate }) => {
    try {
      const data = await createRoom({ username, password, maxUsers, isPrivate });
      toast.success("Room created successfully!");
      setShowCreateRoomPopup(false);
    } catch (err) {
      console.error(err);
      toast.error(err.message || "Failed to create room.");
    }
  };

  return (
    <>
    <div className='flex justify-center items-center h-screen'>
      <div className='flex flex-col justify-center items-center space-y-4'>
        <input 
        placeholder='Enter Room Code To Join' 
        className='border-2 border-amber-500 bg-white p-4 w-xs rounded-3xl 
        placeholder:text-sm text-1xl focus:border-blue-500 focus:outline-none text-center'>
        </input>
        <HomeButton text="Join Room Code"></HomeButton>
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