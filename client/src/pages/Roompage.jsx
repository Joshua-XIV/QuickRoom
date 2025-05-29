import { useState, useEffect } from 'react';
import { useParams, useLocation, useNavigate} from 'react-router-dom';
import SideDisplay from '../components/RoomDisplay';
import {io} from 'socket.io-client'
import GridDisplay from '../components/GridDisplay';

const SOCKET_URL = 'http://localhost:5001'

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
      <SideDisplay code={code} socket={socket} username={username}/>
    </>
  )
}

export default Roompage