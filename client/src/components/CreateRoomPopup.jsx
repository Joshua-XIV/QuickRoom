import React, {useEffect, useState } from 'react'
import { createRoom } from '../../api/createRoom'
import {toast, ToastContainer} from 'react-toastify'
import { useNavigate } from 'react-router-dom';
import Spinner from './Spinner';

const CreateRoomPopup = ({onClose}) => {
  const [isLoading, setIsLoading] = useState(false)
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [maxUsers, setMaxUsers] = useState(10)
  const [isPrivate, setPrivate] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [controller, setController] = useState(null);
  const navigate = useNavigate();

  const handleCreateRoom = async ({ username, password, maxUsers, isPrivate }) => {
    const abortController = new AbortController();
    setController(abortController);
    setIsLoading(true)
    try {
      const data = await createRoom({ username, password, maxUsers, isPrivate }, abortController.signal);
      toast.success("Room Created!");
      navigate(`/room/${data.roomCode}`, {state: {username}});

    } catch (err) {
      if (err.name === 'AbortError') {
        toast.info("Room creation cancelled.");
      } else {
        console.error(err);
        toast.error(err.message || "Failed to create room.");
      }
    } finally {
      setIsLoading(false);
      setController(null)
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

  useEffect(() => {
    return () => {
      if (controller) controller.abort();
    };
  }, [controller]);

  const inputStyle = "border-2 border-amber-500 focus:outline-none focus:border-blue-500 rounded-xl w-xs p-2 disabled:bg-gray-200"
  const labelStyle = "w-24"

  return (
    <div className='flex w-xl h-[50vh] bg-orange items-center justify-center rounded-3xl'>
      <div className="absolute w-fit bg-transparent top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50">
        <Spinner loading={isLoading} />
      </div>
      <form onSubmit={handleSubmit} autoComplete="off" className='bg-white border-2 border-amber-500 rounded-3xl flex flex-col space-y-4 w-full h-full p-4'>
        
        <div className='flex items-center'>
          <label htmlFor="usernameInput" className={labelStyle}>Username:</label>
          <input
          id='usernameInput'
          name='username'
          placeholder='Enter Username'
          className={inputStyle}
          value={username}
          disabled={isLoading}
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
          disabled={isLoading}
          onChange={e => setPassword(e.target.value)}>
          </input>
          <label htmlFor="showPasswordInput" className={`${labelStyle} text-xs ml-4`}>Show Password</label>
          <input
          id='showPasswordInput'
          name='showPassword'
          type='checkbox'
          value={showPassword}
          disabled={isLoading}
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
          disabled={isLoading}
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
          disabled={isLoading}
          >
          </input>
        </div>

        <div className="flex justify-center space-x-2">
          <button type="button" onClick={() => {if(controller) controller.abort(); onClose();}} className="px-4 py-2 border rounded cursor-pointer">Cancel</button>
          <button type="submit" disabled={isLoading} className="px-4 py-2 bg-amber-500 text-white rounded cursor-pointer disabled:bg-amber-500/50 disabled:cursor-default">Create</button>
        </div>
      </form>
    </div>
  )
}

export default CreateRoomPopup