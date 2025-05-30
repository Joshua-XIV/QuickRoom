import React, {useEffect, useState } from 'react'
import { createRoom } from '../../api/createRoom'
import {toast, ToastContainer} from 'react-toastify'
import { useNavigate } from 'react-router-dom';

const CreateRoomPopup = ({onClose}) => {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [maxUsers, setMaxUsers] = useState(10)
  const [isPrivate, setPrivate] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const navigate = useNavigate();

  const handleCreateRoom = async ({ username, password, maxUsers, isPrivate }) => {
    try {
      const data = await createRoom({ username, password, maxUsers, isPrivate });
      toast.success("Room Created!");
      navigate(`/room/${data.roomCode}`, {state: {username}});

    } catch (err) {
      console.error(err);
      toast.error(err.message || "Failed to create room.");
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault()
    handleCreateRoom({username, password, maxUsers, isPrivate})
  };

  useEffect(() => {
    const handleEsc = (event) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener('keydown', handleEsc);

    return () => {
      window.removeEventListener('keydown', handleEsc)
    }
  }, [onClose]);

  const inputStyle = "border-2 border-amber-500 focus:outline-none focus:border-blue-500 rounded-xl w-xs p-2"
  const labelStyle = "w-24"

  return (
    <div className='flex w-xl h-[50vh] bg-orange items-center justify-center rounded-3xl'>
      <form onSubmit={handleSubmit}  autoComplete="off" className='bg-white border-2 border-amber-500 rounded-3xl flex flex-col space-y-4 w-full h-full p-4'>
        
        <div className='flex items-center'>
          <label htmlFor="usernameInput" className={labelStyle}>Username:</label>
          <input
          id='usernameInput'
          name='username'
          placeholder='Enter Username'
          className={inputStyle}
          value={username}
          onChange={e => setUsername(e.target.value)}>
          </input>
        </div>
        
        <div className='flex items-center'>
          <label htmlFor="passwordInput" className={labelStyle}>Password:</label>
          <input
          id='passwordInput'
          name='password'
          type={showPassword ? "text" : "password"}
          placeholder='Enter Password (optional)'
          className={inputStyle}
          value={password}
          onChange={e => setPassword(e.target.value)}>
          </input>
          <label htmlFor="showPasswordInput" className={`${labelStyle} text-xs ml-4`}>Show Password</label>
          <input
          id='showPasswordInput'
          name='showPassword'
          type='checkbox'
          value={showPassword}
          onChange={e => setShowPassword(e.target.checked)}>
          </input>
        </div>

        <div className='flex items-center'>
          <div className='flex flex-col'>
            <label htmlFor="maxUsersInput" className={labelStyle}>Max Users:</label>
            <p className='text-sm text-center pr-4'>(2-20)</p>
          </div>
          <input
          id='maxUsersInput'
          name="maxUsers"
          type="text"
          inputMode="numeric"
          placeholder="Max Amount of Users"
          className={inputStyle}
          value={maxUsers}
          onChange={e => {
            const val = e.target.value;
            // Allow empty input, or only digits (no negatives/decimals)
            if (val === '' || /^[0-9]+$/.test(val)) {
              setMaxUsers(val);
            }
          }}/>
        </div>

        <div className='flex items-center'>
          <label htmlFor="privateInput" className={labelStyle}>Private:</label>
          <input
          id='privateInput'
          name='private'
          type='checkbox'
          checked={isPrivate}
          onChange={e => setPrivate(e.target.checked)}
          >
          </input>
        </div>

        <div className="flex justify-center space-x-2">
          <button type="button" onClick={onClose} className="px-4 py-2 border rounded cursor-pointer">Cancel</button>
          <button type="submit" className="px-4 py-2 bg-amber-500 text-white rounded cursor-pointer">Create</button>
        </div>
      </form>
    </div>
  )
}

export default CreateRoomPopup