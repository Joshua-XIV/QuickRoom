import { useParams } from 'react-router-dom';

const Roompage = () => {
  const {code} = useParams();
  return (
    <div className='text-9xl'>{code}</div>
  )
}

export default Roompage