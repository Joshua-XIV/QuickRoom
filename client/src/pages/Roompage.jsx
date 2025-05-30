import { useState, useEffect } from 'react';
import { useParams, useLocation, useNavigate} from 'react-router-dom';
import RoomDisplay from '../components/RoomDisplay';
import {io} from 'socket.io-client'
import { hasPassword } from '../../api/hasPassword';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL

const Roompage = () => {
  const {code} = useParams();
  const [socket, setSocket] = useState(null)
  const location = useLocation();
  const navigate = useNavigate();
  const { username } = location.state || {};

  useEffect(() => {
    let called = false;
    if (!username) {
      (async () => {
        const res = await hasPassword({ code });
        if (!res.success) {
          // Room doesn't exist or network error, redirect to home
          if (called) alert("Room doesn't Exist");
          navigate('/', { replace: true });
        } else {
          // Room exists, redirect to join page
          navigate(`/room/${code}/join`, { replace: true });
        }
      })();
    }

    return () => {
      called = true;
    }
  }, [username, code, navigate]);

  useEffect(() => {
    let newSocket;
    if (username) {
      newSocket = io(SOCKET_URL, {
        auth: { roomCode: code, username }
      });
      setSocket(newSocket);
    }
  
    return () => {
      if (newSocket) newSocket.disconnect();
    };
  }, [code, username]);

  if (!username) return null;

  return (
    <>
      <RoomDisplay code={code} socket={socket} username={username}/>
    </>
  )
}

export default Roompage