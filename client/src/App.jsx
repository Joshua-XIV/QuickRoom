import { Route, RouterProvider, createBrowserRouter } from "react-router-dom";
import Homepage from './pages/Homepage'
import Roompage from "./pages/Roompage";
import JoinPage from "./pages/JoinPage";

const router = createBrowserRouter([
  {
    path: '/',
    children: [
      {index: true, element: <Homepage/>},
      {path: 'room/:code', element: <Roompage/>},
      {path: 'room/:code/join', element: <JoinPage/>}
    ]
  }
]);

const App = () => {
  return (
    <RouterProvider router={router}/>
  )
}

export default App