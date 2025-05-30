import React, { useEffect, useState } from 'react'
import JoinRoomPopup from '../components/JoinRoomPopup'
import { useNavigate, useParams } from 'react-router-dom'
import { hasPassword } from '../../api/hasPassword'
import Spinner from '../components/Spinner'
import HomeBackGround from '../components/HomeBackGround'
import 'react-toastify/dist/ReactToastify.css';
import {toast, ToastContainer} from 'react-toastify'

const JoinPage = () => {
  const {code} = useParams()
  const [_hasPassword, setHasPassword] = useState(false)
  const [checkHasPassword, setCheckHasPassword] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    (async () => {
      try {
        const data = await hasPassword({code});
        if (data.success) {
          setHasPassword(data.hasPassword);
        } else {
          toast.error(data.reason);
          navigate('/');
        }
      } catch (err) {
        console.log(err);
        toast.error(err);
      } finally {
        setCheckHasPassword(true);
      }
    })()
  }, [])

  const onClose = () => {
    navigate('/')
  }

  return (
    <>
      <HomeBackGround/>
      <ToastContainer className='fixed top-2'/> 
      <div className="absolute w-fit bg-transparent top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50">
        <Spinner loading={!checkHasPassword} />
      </div>
      <div className='absolute w-fit bg-transparent top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50'>
        {checkHasPassword && <JoinRoomPopup onClose={onClose} code={code} hasPassword={_hasPassword}/>}
      </div>
    </>
  )
}

export default JoinPage