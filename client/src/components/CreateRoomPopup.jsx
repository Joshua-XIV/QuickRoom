import React, { use, useState } from 'react'

const CreateRoomPopup = () => {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [maxUsers, setMaxUsers] = useState('')
  const [isPrivate, setPrivate] = useState(false)

  const inputStyle = "border-2 border-amber-500 focus:outline-none focus:border-blue-500 rounded-xl p-2"
  const labelStyle = "w-24"
  return (
    <div className='flex w-xl h-[50vh] bg-orange items-center justify-center rounded-3xl'>
      <form className='bg-white border-2 border-amber-500 rounded-3xl flex flex-col space-y-4 w-full h-full p-4'>
        
        <div className='flex items-center'>
          <label htmlFor="username" className={labelStyle}>Username:</label>
          <input
          name='username'
          placeholder='Enter Username'
          className={inputStyle}>
          </input>
        </div>
        
        <div className='flex items-center'>
        <label htmlFor="username" className={labelStyle}>Password:</label>
          <input
          name='password'
          placeholder='Enter Password (optional)'
          className={inputStyle}>
          </input>
        </div>

        <div className='flex items-center'>
        <label htmlFor="username" className={labelStyle}>Max Users:</label>
          <input
          name='maxUsers'
          placeholder='Max Amount of Users'
          min={2}
          max={20}
          className={inputStyle}>
          </input>
        </div>

        <div className='flex items-center'>
        <label htmlFor="username" className={labelStyle}>Private:</label>
          <input
          name='private'
          type='checkbox'
          >
          </input>
        </div>
      </form>
    </div>
  )
}

export default CreateRoomPopup