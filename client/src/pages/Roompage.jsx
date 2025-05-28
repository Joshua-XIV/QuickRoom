import { useState, useEffect } from 'react';
import { useParams, useLocation, useNavigate} from 'react-router-dom';
import SideDisplay from '../components/SideDisplay';
import {io} from 'socket.io-client'

const SOCKET_URL = import.meta.env.VITE_BACKEND_URL

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
    const newSocket = io(SOCKET_URL, {
      query: {roomCode: code, username: username}
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, [code]);

  if (!username) return null;

  return (
    <>
      <SideDisplay code={code} socket={socket} username={username}/>
    </>
  )
}

export default Roompage