import { useState, useEffect } from 'react';
import { useParams, useLocation, useNavigate} from 'react-router-dom';
import RoomDisplay from '../components/RoomDisplay';
import {io} from 'socket.io-client'

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL

const Roompage = () => {
  const {code} = useParams();
  const [socket, setSocket] = useState(null)
  const location = useLocation();
  const navigate = useNavigate();
  const { username } = location.state || {};


  useEffect(() => {
    if (!username) {
      // Redirect back to home if username is missing
      navigate('/');
      return;
    }
  }, [username, navigate]);

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