import { useContext } from 'react';
import HabitContext from './HabitContextInternal';

export const useHabitContext = () => useContext(HabitContext);

export default useHabitContext;