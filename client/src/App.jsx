import { Route, RouterProvider, createBrowserRouter } from "react-router-dom";
import Homepage from './pages/Homepage'
import Roompage from "./pages/Roompage";

const router = createBrowserRouter([
  {
    path: '/',
    children: [
      {index: true, element: <Homepage/>},
      {path: 'room/:code', element: <Roompage/>}
    ]
  }
]);

const App = () => {
  return (
    <RouterProvider router={router}/>
  )
}

export default App