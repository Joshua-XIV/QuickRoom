import React, { useEffect, useState } from 'react'
import { Socket } from 'socket.io-client';

const GridDisplay = ({socket, code}) => {
  const [users, setUsers] = useState([])

  useEffect(() => {
    if (!code) return;

    const fetchUsers = async () => {
      try {
        const res = await fetch(`/api/rooms/${code}/users`);
        if (!res.ok) throw new Error("Failed to Fetch Users");

        const data = await res.json();
        setUsers(data.users);
      } catch (err) {
        console.error(err)
      }
    }

    fetchUsers();
  }, [code])

  useEffect(() => {
    if (!socket || !code) return

    const handleUpdateUsers = (userList) => {
      setUsers(userList);
    };

    socket.on('update-users', handleUpdateUsers);

    return () => {
      socket.off('update-users', handleUpdateUsers);
    };
  }, [socket, code])

  return (
    <div className='h-screen w-full bg-black/85 border-2 border-amber-500'>
      <div className='grid'>
        {users.map((user, i) => (
          <div key={i} className='bg-white p-4 rounded-2xl'> {user} </div>
        ))}
      </div>
    </div>
  )
}

export default GridDisplay