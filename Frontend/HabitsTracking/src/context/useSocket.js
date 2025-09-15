import { useContext } from 'react';
import SocketContext from './_SocketInternalContext';
export const useSocket = () => useContext(SocketContext);
export default useSocket;