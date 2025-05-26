import { Route, RouterProvider, createBrowserRouter } from "react-router-dom";
import Homepage from './pages/Homepage'

const router = createBrowserRouter([
  {
    path: '/',
    children: [
      {index: true, element: <Homepage/>},
    ]
  }
]);

const App = () => {
  return (
    <RouterProvider router={router}/>
  )
}

export default App