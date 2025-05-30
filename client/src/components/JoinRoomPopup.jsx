import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom';
import { joinRoom } from '../api/joinRoom';
import {toast, ToastContainer} from 'react-toastify'



const JoinRoomPopup = ({onClose, code, hasPassword}) => {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const navigate = useNavigate();

  const handleJoinRoom = async ({code, username, password}) => {
    if (!code) {
      toast.error("Invalid Code");
      return;
    }
    try {
      const data = await joinRoom({code, username, password});
      toast.success("Room Joined!")
      navigate(`/room/${data.roomCode}`, {state: {username}});
    } catch (err) {
      console.error(err);
      toast.error(err.message || "Failed to join room.")
    }
  };

  useEffect(() => {
    const handleEsc = (event) => {
      if (event.key == "Escape") {
        onClose();
      }
    }

    window.addEventListener('keydown', handleEsc)
    return () => {
      window.removeEventListener('keydown', handleEsc)
    }
  }, [onClose]);

  const inputStyle = "border-2 border-amber-500 focus:outline-none focus:border-blue-500 rounded-xl w-xs p-2"
  const labelStyle = "w-24"

  return (
    <div className='flex w-xl h-[50vh] bg-orange items-center justify-center rounded-3xl'>
      <form 
      onSubmit={(e) => {
        e.preventDefault(); 
        console.log("Form submitted");
        handleJoinRoom({code, username, password});}
      }  
      autoComplete="off" 
      className='bg-white border-2 border-amber-500 rounded-3xl flex flex-col space-y-4 w-full h-full p-4'>
        <h2 className="text-center font-semibold text-lg">Joining Room: <span className="text-blue-600">{code}</span></h2>
        <div className='flex items-center justify-center'>
          <label htmlFor="usernameInput" className={labelStyle}>Username:</label>
          <input
          id="usernameInput"
          name='username'
          placeholder='Enter Username'
          className={inputStyle}
          value={username}
          onChange={e => setUsername(e.target.value)}>
          </input>
        </div>

        {hasPassword && 
        <>
          <div className='flex items-center justify-center'>
            <label htmlFor="passwordInput" className={labelStyle}>Password:</label>
            <input
            id="passwordInput"
            name='password'
            type={showPassword ? "text" : "password"}
            placeholder='Enter Password (required)'
            className={inputStyle}
            value={password}
            onChange={e => setPassword(e.target.value)}>
            </input>
          </div>
          <div className='flex items-center justify-center'>
            <label htmlFor="showPasswordInput" className={`${labelStyle} text-xs ml-4`}>Show Password</label>
            <input
            id='showPasswordInput'
            name='showPassword'
            type='checkbox'
            checked={showPassword}
            onChange={e => setShowPassword(e.target.checked)}>
            </input>
          </div>
        </>
        }  
        

        <div className="flex justify-center space-x-2 my-auto">
          <button type="button" onClick={onClose} className="px-4 py-2 border rounded cursor-pointer">Cancel</button>
          <button type="submit" className="px-4 py-2 bg-amber-500 text-white rounded cursor-pointer">Join</button>
        </div>
      </form>
    </div>
  )
}

export default JoinRoomPopup