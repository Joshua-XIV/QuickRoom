import React, { useEffect, useRef, useState } from 'react'
import { getRooms } from '../../api/getRooms';
import {toast} from 'react-toastify'
import JoinRoomPopup from './JoinRoomPopup';
import Spinner from './Spinner';

const BrowseRoomPopup = ({onClose}) => {
  const [data, setData] = useState([])
  const [grabCode, setGrabCode] = useState('')
  const [grabHasPassword, setGrabHasPassword] = useState(false)
  const [refresh, setRefresh] = useState(false)
  const [showJoinRoomPopup, setShowJoinRoomPop] = useState(false)
  const [sortByUsers, setSortByUsers] = useState(null);
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    const handleEsc = (event) => {
      if (event.key === "Escape") {
        onClose();
      }
    }
  
    window.addEventListener('keydown', handleEsc);
    return () => {
      window.removeEventListener('keydown', handleEsc);
    }
  }, [onClose]);

  const handleGetRooms = async () => {
    setIsLoading(true)
    try {
      const data = await getRooms();
      return data;
    } catch (err) {
      console.error(err)
      toast.error("Failed to Get Rooms");
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    const fetchRooms = async () => {
      const rooms = await handleGetRooms();
      if (rooms) {
        setData(rooms);
      }
    };
    fetchRooms();
  }, [refresh])

  const handleJoinRoomClick = (e) => {
    setShowJoinRoomPop(true)
  }

  const handleJoinRoomClose = (e) => {
    setShowJoinRoomPop(false)
  }


  return (
    <>
      <div className='border-2 border-amber-500 bg-gray-400 min-w-96 sm:w-xl md:w-2xl h-[70vh] flex flex-col'>
        <div className="absolute inset-0 bg-transparent flex items-center justify-center z-50">
          <Spinner loading={isLoading} />
        </div>
        <div className='w-full bg-gray-400 flex justify-between border-2 p-2'>
          <p className='ml-6'>Room</p>
          <div className='flex space-x-6'>
            <p 
            className='underline cursor-pointer'
            onClick={() => {setSortByUsers((prev) => {
              if (prev === null) return 'asc';
              if (prev === 'asc') return 'desc';
              return null;
              });
            }}>
              Users
              {sortByUsers === 'asc' && <span>↑</span>}
              {sortByUsers === 'desc' && <span>↓</span>}
            </p>
            <p>Password</p>
          </div>
        </div>
        <div className='flex-grow overflow-y-auto'>
          {Object.entries(data)
          .sort(([, a], [, b]) => {
            if (sortByUsers === 'asc') return a.userLength - b.userLength;
            if (sortByUsers === 'desc') return b.userLength - a.userLength;
            if (sortByUsers === null) return 
          })
          .map(([code, room]) =>  {
            const isSelected = grabCode === code
            return (
              <button className={`w-full ${isSelected ? "bg-amber-500" : "hover:bg-amber-200"}`} onClick={() => {setGrabCode(code); setGrabHasPassword(room.hasPassword)}} key={code}>
                <div className='flex justify-between border-x-2 border-b-2 p-4' key={code}>
                  <p className=''><strong>{code}</strong></p>
                  <div className='flex space-x-12'>
                    <p className='w-10'><strong>{room.userLength}/{room.maxUsers}</strong></p>
                    <p className='w-10'><strong>{room.hasPassword ? "Yes" : "No"}</strong></p>
                  </div>
                </div>
              </button>
            )
          })}
        </div>
        <div className="flex justify-between border-2 p-2 space-x-2">
          <button type="button" onClick={onClose} className="px-4 py-2 border-2 bg-red-400 rounded cursor-pointer w-24 hover:bg-red-700">Cancel</button>
          <div className='space-x-12'>
            <button onClick={() => setRefresh(!refresh)} className='px-4 py-2 border-2 w-24 rounded bg-blue-500 cursor-pointer hover:bg-blue-700'>Refresh</button>
            <button onClick={handleJoinRoomClick} className="px-4 py-2 w-24 bg-amber-500 border-2 text-black rounded cursor-pointer disabled:bg-amber-500/50 hover:bg-amber-600" disabled={!grabCode}>Join</button>
          </div>
        </div>
      </div>
      {showJoinRoomPopup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <JoinRoomPopup
            onClose={handleJoinRoomClose}
            code={grabCode}
            hasPassword={grabHasPassword}
          />
        </div>
      )}
    </>
  )
}

export default BrowseRoomPopup