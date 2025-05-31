import React, { useState } from 'react'
import HomeButton from './HomeButton'
import 'react-toastify/dist/ReactToastify.css';
import {toast, ToastContainer} from 'react-toastify'
import CreateRoomPopup from './CreateRoomPopup';
import JoinRoomPopup from './JoinRoomPopup';
import { hasPassword } from '../../api/hasPassword';
import BrowseRoomPopup from './BrowseRoomPopup';

const HomeSelection = () => {
  const[showCreateRoomPopup, setShowCreateRoomPopup] = useState(false);
  const[showJoinRoomPopup, setJoinRoomPopup] = useState(false);
  const[showBrowseRoomPop, setShowBrowseRoomPop] = useState(false);
  const[inputCode, setInputCode] = useState('');
  const[showRequiredPassword, setShowRequiredPassword] = useState(false);
  
  const handleCreateRoomClick = (e) => {
    setShowCreateRoomPopup(true);
  }
  const handleCreateRoomClose = (e) => {
    setShowCreateRoomPopup(false);
  }
  const handleBrowseRoomClick = (e) => {
    setShowBrowseRoomPop(true)
  }
  const handleBrowseRoomClose = (e) => {
    setShowBrowseRoomPop(false)
  }
  const handleJoinRoomClick = async () => {
    if (!inputCode || inputCode.trim().length === 0) {
      toast.error("Please enter a room code.");
      return;
    }
  
    try {
      toast.info("Checking if room exists")
      const result = await hasPassword({ code: inputCode.trim() });
      if (result.success) {
        setJoinRoomPopup(true);
        setShowRequiredPassword(result.hasPassword)
      } else {
        toast.error(result.reason || "Room not found.");
      }
    } catch (err) {
      console.error(err);
      toast.error("Something went wrong. Please try again.");
    }
  };
  
  const handleJoinRoomClose = (e) => {
    setJoinRoomPopup(false)
  }

  return (
    <>
    <div className='flex justify-center items-center h-screen'>
      <div className={`flex flex-col justify-center items-center space-y-4 ${showBrowseRoomPop && 'hidden'}`}>
        <form onSubmit={(e) => {
            e.preventDefault();
            handleJoinRoomClick(); 
          }} 
          className='flex flex-col justify-center items-center space-y-4'>
          <input
            placeholder='Enter Room Code To Join'
            className='border-2 border-amber-500 bg-white p-4 w-xs rounded-3xl
            placeholder:text-sm text-1xl focus:border-blue-500 focus:outline-none text-center'
            onChange={(e) => {
              const rawValue = e.target.value.toUpperCase();
              const filteredValue = rawValue.replace(/[^A-Z0-9]/g, ''); // only A-Z and 0-9
              setInputCode(filteredValue);
            }}
            value={inputCode}
            maxLength={8}>
          </input>
          <HomeButton text="Join Room Code" action={handleJoinRoomClick}/>
        </form>
        <HomeButton text="Create a Room" action={handleCreateRoomClick}></HomeButton>
        <HomeButton text="Browse Rooms" action={handleBrowseRoomClick}></HomeButton>
      </div>
      <div className='fixed flex justify-center items-center'>
        {showCreateRoomPopup && <CreateRoomPopup onClose={handleCreateRoomClose}></CreateRoomPopup>}
      </div>
      <div className='fixed flex justify-center items-center'> 
        {showJoinRoomPopup && <JoinRoomPopup onClose={handleJoinRoomClose} code={inputCode} hasPassword={showRequiredPassword}/>}
      </div>
      <div className='fixed flex justify-center items-center'> 
        {showBrowseRoomPop && <BrowseRoomPopup onClose={handleBrowseRoomClose}/>}
      </div>
    </div>
    <ToastContainer className='fixed top-2'></ToastContainer>
    </>
  )
}

export default HomeSelection