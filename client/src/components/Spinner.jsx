import ClipLoader from 'react-spinners/ClipLoader'

const Spinner = ({loading}) => {
  return (
    <ClipLoader
    color='#4338ca'
    loading={loading}/>
  )
}

export default Spinner