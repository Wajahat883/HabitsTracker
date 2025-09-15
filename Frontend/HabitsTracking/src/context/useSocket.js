import { useContext } from 'react';
import SocketContext from './SocketContext';

export default function useSocket() {
  return useContext(SocketContext);
}